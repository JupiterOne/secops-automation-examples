import { Octokit } from "@octokit/rest"; 
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node/index.cjs';
import fs from "fs";
import path from "path";

const { version } = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const USERAGENT = `J1 CODEOWNERS Automation v${version}`;
const PRBRANCH = USERAGENT.toLowerCase().replace(/ /g, '-');
const ERRLOG = 'error.log';
const DEFAULT_ORG = process.env.DEFAULT_ORG || 'jupiterone';
const DEFAULT_OWNER = process.env.DEFAULT_OWNER || 'jupiterone';

async function processRepo(repo, filteredTeamsLookup) {
  if (repo.archived) {
    log(`SKIPPING repo ${repo.name}, since it is archived.`, 'warn');
    return;
  }

  if(await doesCODEOWNERSExist(repo.name)) {
    log(`SKIPPING repo ${repo.name} due to existing CODEOWNERS file.`, 'warn');
    return;
  }

  // discover teams to add to CODEOWNERS
  const { ownerTeams, debugCommitAuthors } = await generateTeamOwnersForRepo(repo.name, filteredTeamsLookup);

  for (const team of ownerTeams) {
    await addTeamToRepo(team, repo.name); // ensure team has push-or-higher access (so CODEOWNERS validates)
  }
  const branch = await createCODEOWNERSBranch(ownerTeams, repo.name);
  await createPullRequest(branch, repo, debugCommitAuthors);
}

async function doesCODEOWNERSExist(repo, owner=DEFAULT_OWNER) {
  log(`Checking if repo ${repo} already has a CODEOWNERS file...`);
  // per https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners#codeowners-file-location
  if (await contentExists(repo, 'CODEOWNERS')) return true;
  if (await contentExists(repo, 'docs/CODEOWNERS')) return true;
  if (await contentExists(repo, '.github/CODEOWNERS')) return true;
  return false;
}

async function contentExists(repo, path, owner=DEFAULT_OWNER) {
  let content;
  try {
    content = await octokit.repos.getContent({owner, repo, path});
  } catch (e) {
    if (e.status) { // throw on 404, thanks for that.
      content=e;
    } else {
      throw new Error(e);
    }
  }
  return content.status === 200;
}

async function generateTeamOwnersForRepo(repo, teamsLookup) {
  log(`Generating team ownership for repo: ${repo}`);
  const owners = new Set();
  log(`Grabbing commits and authors for repo: ${repo}...`);
  const commitAuthors = await getTopFrecentAuthorLogins(repo, 4, 60);
  log(`Top commit authors for repo ${repo} were: ${commitAuthors.join(', ')}...`, 'debug');

  for (const author of commitAuthors) {
    const authorTeams = teamsLookup[author];
    if (!authorTeams) { continue; } // skip committers not currently part of org
    for (const team of authorTeams) {
      owners.add(team);
    }
  }
  if (!owners.size) {
    log('WARN: no unique teams found among active commit authors, defaulting to "engineering"... ', 'warn');
    owners.add('engineering');
  }
  const ownerTeams = Array.from(owners);

  log(`Team OWNERS for ${repo}: ${ownerTeams.join(', ')}...`);
  return { ownerTeams, commitAuthors };
}

async function getTopFrecentAuthorLogins(repo, numAuthors=5, numCommits=100, owner=DEFAULT_OWNER) {
  try {
    const commits = await getRecentCommits(repo, numCommits, owner);
    const len = commits.length;
    const authorsScores = {};
    for (const i in commits) {
      const weight = len - i; // weight bias toward most recent commits
      const currentAuthor = commits[i].author;
      if (! currentAuthor?.login || currentAuthor?.login.indexOf('[bot]') !== -1) { continue; } // skip commits lacking clear human authorship
      if (!authorsScores[currentAuthor.login]) {
        authorsScores[currentAuthor.login] = weight;
      } else {
        authorsScores[currentAuthor.login] += weight;
      }
    }
    const sortedArrayOfWeightedLogins = Object.entries(authorsScores).sort((a,b) => { return b[1] - a[1]; }); // [ ['user1', 100], ['user2', 92],...]
    const topAuthorsSliceOfWeightedLogins = sortedArrayOfWeightedLogins.slice(0, numAuthors); 
    return topAuthorsSliceOfWeightedLogins.map(entry => entry[0]); // [ 'user1', 'user2' ]
  } catch (err) {
    log({repo, err}, 'warn');
    return [];
  }
}

async function getRecentCommits(repo, max=100, owner=DEFAULT_OWNER) {
  log(`Retrieving last ${max} commits for repo ${repo}...`);
  return octokit.paginate(
    octokit.repos.listCommits,
    {owner, repo, per_page: max},
    response => response.data);
}

async function addTeamToRepo(team_slug, repo, permission='push', org=DEFAULT_ORG, owner=DEFAULT_OWNER) {
  log(`Adding team ${team_slug} to repo ${repo}...`);
  await waitForSecondaryRateLimitWindow();
  const updatePromise = octokit.teams.addOrUpdateRepoPermissionsInOrg({
    org,
    team_slug,
    owner,
    repo,
    permission
  });
  addRateLimitingEvent();
  return updatePromise;
}

async function createCODEOWNERSBranch(owners, repo, org=DEFAULT_ORG, branch=PRBRANCH) {

  log(`Creating branch ${branch} for ${repo}...`);
  const dir = `./${repo}`;
  await cloneRepo(repo, dir);
  await checkoutBranch(dir, branch);

  const codeownersStr = '* ' + owners.map(team => `@${org}/${team.trim()}`).join(' ');

  log(`Creating CODEOWNERS file for ${repo}/${branch}...`);
  fs.writeFileSync(path.join(dir, 'CODEOWNERS'), codeownersStr, 'ascii');
  await git.add({ fs, dir, filepath: 'CODEOWNERS' });
  await git.commit({
    fs,
    dir,
    author: {
      name: USERAGENT,
      email: 'security@jupiterone.com'
    },
    message: 'Add CODEOWNERS'
  });

  log(`Pushing branch ${branch} to remote...`);
  await waitForSecondaryRateLimitWindow();
  await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    onAuth: isometricGitOnAuthGitHubFn
  });

  addRateLimitingEvent();
  return branch;
}

async function cloneRepo(repo, dir=`./${repo}`, org=DEFAULT_ORG) {
  await git.clone({
    fs,
    http,
    dir,
    url: `https://github.com/${org}/${repo}`,
    onAuth: isometricGitOnAuthGitHubFn,
    singleBranch: true,
    depth: 2
  });
}

async function checkoutBranch(dir, ref) {
  await git.branch({
    fs,
    dir,
    ref,
    checkout: true
  });
}

async function createPullRequest(head, repo, authors, owner=DEFAULT_OWNER) {
  log(`Creating pull request for ${repo.name} from ${head} -> ${repo.default_branch}`);
  await waitForSecondaryRateLimitWindow();
  const prPromise = octokit.pulls.create({
    owner,
    head,
    repo: repo.name,
    base: repo.default_branch,
    title: 'Add CODEOWNERS',
    body: `Automatically generated by ${USERAGENT}\n\n` +
    'Based on team membership for identified commit authors: ' +
    authors.join(', ')
  });
  addRateLimitingEvent();
  return prPromise;
}

const isometricGitOnAuthGitHubFn = () => { return { username: process.env.GITHUB_AUTH_TOKEN, password: '' }; };

const rateLimitingEventLog = [];

function addRateLimitingEvent() {
  rateLimitingEventLog.push(Date.now());
}

// intentionally slow down to avoid triggering undocumented secondary rate limits
// https://docs.github.com/en/rest/overview/resources-in-the-rest-api#secondary-rate-limits
async function waitForSecondaryRateLimitWindow(events=2, seconds=1, sleepMillis=300) {
  let windowEvents, isWaiting;
  do {
    windowEvents = rateLimitingEventLog.filter(e => e >= Date.now() - (seconds * 1000));
    if (windowEvents.length > events) {
      if(!isWaiting) {
        log(`Secondary rate limit exceeded. (${windowEvents.length} events/${seconds}secs) Waiting for window to clear...`, 'warn');
        isWaiting=true;
      }
      await new Promise(resolve => { setTimeout(resolve, sleepMillis); });
    }
  } while (windowEvents.length > events)
}

function log(msg, level='log') {
  if (! process.env.SILENT) {
    console[level](msg);
  }
}

async function getOrgRepos(org=DEFAULT_ORG) {
  log('Discovering repos... ');
  return octokit.paginate(
    octokit.repos.listForOrg,
    { org, per_page: 100 },
    response => response.data);
}

// returns {
//   user1: [ 'teamslug1', 'teamslug2' ],
//   user2: [ 'teamslug2' ],
//   user3: []
// }
async function generateTeamMembershipLookup(org=DEFAULT_ORG) {
  log('Discovering teams and memberships... ');
  const teams = (await octokit.teams.list({
    org
  })).data;
  const memberLookup = {};
  for (const team of teams) {
    const members = (await octokit.teams.listMembersInOrg({org, team_slug: team.slug, per_page: 100 })).data;
    for (const member of members) {
      memberLookup[member.login] ? memberLookup[member.login].push(team.slug) : memberLookup[member.login] = [ team.slug ];
    }
  }
  return filterTeamMemberships(memberLookup);
}

// exclude members' teams that are not good candidates for ownership
function filterTeamMemberships(memberLookup) {
  const filtered = {};
  Object.keys(memberLookup).forEach(member => {
    const filteredArray = memberLookup[member].filter(team => {
      if (team.indexOf('admin') !== -1) return false;
      if (team.indexOf('contract') !== -1) return false;
      if (team === 'everyone') return false;
      if (team === 'engineering') return false;
      return true;
    });
    filtered[member] = filteredArray;
  });

  return filtered;
}

if (! process.env.GITHUB_AUTH_TOKEN) {
  log('You must export a personal auth token as GITHUB_AUTH_TOKEN!', 'warn');
  process.exit(2);
}

const octokit = new Octokit({
  auth: process.env.GITHUB_AUTH_TOKEN,
  userAgent: USERAGENT,
  // log: console
});

// Monkey-see, Monkey-patch...
// https://stackoverflow.com/a/18391400
if (!('toJSON' in Error.prototype))
Object.defineProperty(Error.prototype, 'toJSON', {
    value: function () {
        var alt = {};
        Object.getOwnPropertyNames(this).forEach(function (key) {
            alt[key] = this[key];
        }, this);
        return alt;
    },
    configurable: true,
    writable: true
});

async function main() {
  const filteredTeamsLookup = await generateTeamMembershipLookup();
  const repos = await getOrgRepos();
  // TODO: account for opt-in adoptions
  const errlog = fs.createWriteStream(ERRLOG, {flags: 'a'});
  for (const repo of repos) {
    try {
      await processRepo(repo, filteredTeamsLookup);
    } catch (err) {
      const errMsg = `Error processing ${repo.name}: ${JSON.stringify(err, null, 2)}`;
      log(errMsg, 'warn');
      errlog.write(errMsg);
    }
  }
}

main().then(console.log).catch(console.error);
