import { Octokit } from '@octokit/rest'; 
import { throttling } from '@octokit/plugin-throttling';
import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node/index.cjs';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const { version } = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const USERAGENT = `J1 CODEOWNERS Automation v${version}`;
const PRBRANCH = USERAGENT.toLowerCase().replace(/ /g, '-');
const PRTITLE = process.env.PRTITLE || 'Add CODEOWNERS';
const ERRLOG = process.env.ERRLOG || 'error.log';
const ORG = process.env.ORG || 'jupiterone';
const OWNER = process.env.OWNER || 'jupiterone';
const DEFAULT_TEAM = process.env.DEFAULT_TEAM || 'engineering';
const RUNMODE = process.env.RUNMODE || 'open_pulls';
const DEBUG = process.env.DEBUG || false; // debug mode
const SILENT = process.env.SILENT || false; // no logs

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
  const { ownerTeams, commitAuthors } = await generateTeamOwnersForRepo(repo.name, filteredTeamsLookup);

  for (const team of ownerTeams) {
    await addTeamToRepo(team, repo.name); // ensure team has push-or-higher access (so CODEOWNERS validates)
  }
  const branch = await createCODEOWNERSBranch(ownerTeams, repo.name);
  await createPullRequest(branch, repo, commitAuthors);
}

async function doesCODEOWNERSExist(repo, owner=OWNER) {
  log(`Checking if repo ${repo} already has a CODEOWNERS file...`);
  // per https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners#codeowners-file-location
  if (await contentExists(repo, 'CODEOWNERS')) return true;
  if (await contentExists(repo, 'docs/CODEOWNERS')) return true;
  if (await contentExists(repo, '.github/CODEOWNERS')) return true;
  return false;
}

async function contentExists(repo, path, owner=OWNER) {
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
    log(`WARN: no unique teams found among active commit authors, defaulting to "${DEFAULT_TEAM}"... `, 'warn');
    owners.add(DEFAULT_TEAM);
  }
  const ownerTeams = Array.from(owners);

  log(`Team OWNERS for ${repo}: ${ownerTeams.join(', ')}...`);
  return { ownerTeams, commitAuthors };
}

async function getTopFrecentAuthorLogins(repo, numAuthors=5, numCommits=100, owner=OWNER) {
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

async function getRecentCommits(repo, max=100, owner=OWNER) {
  log(`Retrieving last ${max} commits for repo ${repo}...`);
  return octokit.paginate(
    octokit.repos.listCommits,
    {owner, repo, per_page: max},
    response => response.data);
}

async function addTeamToRepo(team_slug, repo, permission='push', org=ORG, owner=OWNER) {
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

async function createCODEOWNERSBranch(owners, repo, org=ORG, branch=PRBRANCH) {

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

  await cleanupLocalDir(repo);
  return branch;
}

async function cloneRepo(repo, dir=`./${repo}`, org=ORG) {
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

async function createPullRequest(head, repo, authors, owner=OWNER) {
  log(`Creating pull request for ${repo.name} from ${head} -> ${repo.default_branch}`);
  await waitForSecondaryRateLimitWindow();
  const prPromise = octokit.pulls.create({
    owner,
    head,
    repo: repo.name,
    base: repo.default_branch,
    title: PRTITLE,
    body: `Automatically generated by ${USERAGENT}\n\n` +
    'Based on team membership for identified commit authors: ' +
    authors.join(', ')
  });
  addRateLimitingEvent();
  return prPromise;
}

async function cleanupLocalDir(repo) {

  if (repo.indexOf('.') !== -1) {
    log(`Directory '${repo}' appears to contain '.' chars, cowardly refusing to attempt a recursive cleanup...`, 'warn');
    return;
  }
  fs.rmdir(repo, { recursive: true }, (err) => {
    if (err) {
      throw err;
    }
    log(`Directory '${repo}' has been deleted!`);
});
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
  if (level==='debug' && !DEBUG) {
    return;
  }
  if (! SILENT) {
    console[level](msg);
  }
}

async function getOrgRepos(org=ORG) {
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
async function generateTeamMembershipLookup(org=ORG) {
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
      if (team === DEFAULT_TEAM) return false;
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

const MyOctokit = Octokit.plugin(throttling);

const octokit = new MyOctokit({
  auth: process.env.GITHUB_AUTH_TOKEN,
  userAgent: USERAGENT,
  // log: console
  throttle: {
    onRateLimit: (retryAfter, options, octokit) => {
      octokit.log.warn(
        `Request quota exhausted for request ${options.method} ${options.url}`
      );

      if (options.request.retryCount === 0) {
        // only retries once
        octokit.log.info(`Retrying after ${retryAfter} seconds!`);
        return true;
      }
    },
    onSecondaryRateLimit: (retryAfter, options, octokit) => {
      // does not retry, only logs a warning
      octokit.log.warn(
        `SecondaryRateLimit detected for request ${options.method} ${options.url}`
      );
    },
  },
});

// Monkey-see, Monkey-patch...
// https://stackoverflow.com/a/18391400
// allows thrown Errors to be JSON.stringified
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
  log(`RUNMODE is: ${RUNMODE}`);
  const filteredTeamsLookup = await generateTeamMembershipLookup();
  const repos = await getOrgRepos();
  // TODO: account for opt-in adoptions
  const errlog = fs.createWriteStream(ERRLOG, {flags: 'a'});
  for (const repo of repos) {
    try {
      switch (RUNMODE) {
        case 'open_pulls':
          await processRepo(repo, filteredTeamsLookup);
          break;
        case 'merge_pulls':
          await mergeRepoPR(repo.name);
          break;
        default:
          log(`Unknown RUNMODE: '${RUNMODE}'`, 'error');
          process.exit(2);
      }
    } catch (err) {
      const errMsg = `Error processing ${repo.name}: ${JSON.stringify(err, null, 2)}`;
      log(errMsg, 'warn');
      errlog.write(errMsg);
    }
  }
}

function getBypassAllowancePayload(protection) {
  const bypassAllowancePayload = {
    users: (protection.required_pull_request_reviews?.bypass_pull_request_allowances?.users || []).map(u=>u.slug),
    teams: (protection.required_pull_request_reviews?.bypass_pull_request_allowances?.teams || []).map(t=>t.slug),
  };
  // payload only makes sense when non-empty.
  const shouldBypass = Object.keys(bypassAllowancePayload).reduce(
    (acc, curKey) => acc || bypassAllowancePayload[curKey].length > 0, false);
  return { shouldBypass, bypassAllowancePayload };
}

function getRestrictionsPayload(protection) {
  const restrictionsPayload = {
    users: (protection.restrictions?.users || []).map(u=>u.slug),
    teams: (protection.restrictions?.teams || []).map(t=>t.slug),
    apps: (protection.restrictions?.apps || []).map(a=>a.slug),
  };
  // payload only makes sense when non-empty.
  const shouldRestrict = Object.keys(restrictionsPayload).reduce(
    (acc, curKey) => acc || restrictionsPayload[curKey].length > 0, false);
  return { shouldRestrict, restrictionsPayload };
}

async function mergeRepoPR(repo) {
  log(`Checking pr status for repo: ${repo.name}...`);
  const { data: prs } = await octokit.pulls.list({
    owner: OWNER,
    repo: repo.name,
    head: `${ORG}:${PRBRANCH}`,
    base: repo.default_branch,
    state: 'open'
  });
  const pr = prs[0];
  if (!pr) {
    return; // no mergeable PRs found
  }
  log(`Found mergeable PR: ${pr.html_url}`);

  log(`Retrieving branch protection rules for ${repo.name}:${repo.default_branch}...`);
  const protection = await getDefaultBranchProtection(repo);

  if (protection) {
    log(`Removing branch protection rules for ${repo.name}:${repo.default_branch}...`);
    await octokit.repos.deleteBranchProtection({
      owner: OWNER,
      repo: repo.name,
      branch: repo.default_branch
    });
  }

  log(`Merging pr#${pr.number} for ${repo.name}...`);
  const mergeRes = await octokit.pulls.merge({
    owner: OWNER,
    repo: repo.name,
    pull_number: pr.number,
    commit_title: `Merged via ${PRBRANCH}`
  });
  if (DEBUG) log(JSON.stringify(mergeRes, null, 2), 'debug');

  if (protection) {
    log(`Restoring branch protection rules for ${repo.name}:${repo.default_branch}...`);

    const { shouldBypass, bypassAllowancePayload } = getBypassAllowancePayload(protection);
    const { shouldRestrict, restrictionsPayload } = getRestrictionsPayload(protection);

    const updateBranchProtectionPayload = {
      owner: OWNER,
      repo: repo.name,
      branch: repo.default_branch,
      required_pull_request_reviews: {
        dismiss_stale_reviews: protection.required_pull_request_reviews?.dismiss_stale_reviews,
        required_approving_review_count: protection.required_pull_request_reviews?.required_approving_review_count || 1,
        require_code_owner_reviews: true,  // <== likely the point of this whole exercise
      },
      enforce_admins: protection.enforce_admins?.enabled,
      required_status_checks: {
        strict: protection.required_status_checks?.strict,
        checks: protection.required_status_checks?.checks,
      },
      required_signatures: protection.required_signatures?.enabled,
      required_linear_history: protection.required_linear_history?.enabled,
      allow_force_pushes: protection.allow_force_pushes?.enabled,
      allow_deletions: protection.allow_deletions?.enabled,
      required_conversation_resolution: protection.required_conversation_resolution?.enabled,  
    };

    if (shouldBypass) {
      updateBranchProtectionPayload.required_pull_request_reviews.bypass_pull_request_allowances = bypassAllowancePayload;
    }
    updateBranchProtectionPayload.restrictions = shouldRestrict ? restrictionsPayload : null; // required field

    const updateRes = await octokit.repos.updateBranchProtection(updateBranchProtectionPayload);
    if (DEBUG) log(JSON.stringify(updateRes, null, 2), 'debug');
  }

 return;
}

async function getDefaultBranchProtection(repo) {
  let protection;
  try {
    const { data } = await octokit.repos.getBranchProtection({
      owner: OWNER,
      repo: repo.name,
      branch: repo.default_branch,
    });
    protection = data;
  } catch (err) {
    if (err?.status === 404) {
      return undefined;
    }
    throw new Error(err);
  }
  if (DEBUG) {
    const logFile = `${repo.name}-branch-protection-config_${new Date().toISOString().replace(/[-:]+/g,'').split('.')[0]}.json`;
    log(`Preserving branch protection configuration to ${logFile}...`, 'debug');
    fs.writeFileSync(logFile, JSON.stringify(protection, null, 2), { encoding: 'utf8'});
  }
  return protection;
}

main().then(console.log).catch(console.error);
