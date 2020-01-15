const BitbucketClient = require('./util/BitbucketClient');
const spawn = require('./util/spawn');
const fs = require('fs');
const JupiterOneClient = require('@jupiterone/jupiterone-client-nodejs');
const { createEntities, toFindingEntities } = require('./util/j1Helpers');

async function gatherConfig () {
  const config = {
    bitbucketKey: process.env.BITBUCKET_OAUTH_KEY,
    bitbucketSecret: process.env.BITBUCKET_OAUTH_SECRET,
    bitbucketSshKeyB64: process.env.BITBUCKET_SSH_PRIVATE_KEY,
    bitbucketReposToSkip: (process.env.BITBUCKET_REPOS_TO_SKIP_CSV || '').split(',').map(i => i.trim()).filter(i => i.length),
    bitbucketOrgs: (process.env.BITBUCKET_ORGS_CSV || '').split(',').map(i => i.trim()).filter(i => i.length),
    sshKeyFilePath: process.env.SSH_KEY_FILE_PATH || '/tmp/id_rsa',
    j1AccessToken: process.env.J1_ACCESS_TOKEN,
    j1Account: process.env.J1_ACCOUNT,
    gitleaksConfig: process.env.GITLEAKS_CONFIG || '/opt/jupiter-gitleaks-powerup/gitleaks.config',
    gitleaksBinPath: process.env.GITLEAKS_BIN_PATH || '/usr/bin/gitleaks',
    githubOrgs: (process.env.GITHUB_ORGS_CSV || '').split(',').map(i => i.trim()).filter(i => i.length)
  };

  const requiredVars = ['bitbucketKey', 'bitbucketSecret', 'bitbucketSshKeyB64', 'j1AccessToken', 'j1Account'];
  if (requiredVars.some(v => { return !config[v]; })) {
    throw new Error('missing one or more required environment variables: ' + requiredVars);
  }

  return config;
}

async function scanBitbucketRepos(config, j1Client, bitbucketOrg) {
  writeDecodedSSHKeyFile(config.sshKeyFilePath, config.bitbucketSshKeyB64);

  const bbClient = await createBitbucketClient(config);
  console.log('retrieving bitbucket repo URLs for org: ' + bitbucketOrg);
  const repoUrls = await bbSSHCloneUrls(bbClient, bitbucketOrg);
  console.log(repoUrls.length + ' bitbucket repos found');
  for (const repoUrl of repoUrls) {
    const shouldSkip = config.bitbucketReposToSkip.some(skipString => {
      if (repoUrl.indexOf(skipString) > -1) {
        return true;
      }
    });
    if (shouldSkip) {
      continue; // skip repo, per configuration
    }
    const repoName = repoUrl.split('/').pop().slice(0, -4);
    console.log(`scanning ${repoName} repo...`);
    const reportFile = `/tmp/${repoName}.json`;

    const args = [
      '--config=' + config.gitleaksConfig,
      '--ssh-key=' + config.sshKeyFilePath,
      '--repo=' + repoUrl,
      '--redact',
      '--report=' + reportFile
    ];

    await scan(args, 'bitbucket', j1Client, reportFile);
  }
}

async function createBitbucketClient (config) {
  const bitbucketAccessToken = await BitbucketClient.getAccessToken(
    config.bitbucketKey,
    config.bitbucketSecret);

  return new BitbucketClient({
    accessToken: bitbucketAccessToken
  });
}

async function bbSSHCloneUrls (bbClient, bbOrg) {
  const repos = await bbClient.getRepos(bbOrg);
  return repos.map(r => r.links.clone.filter(l => l.name === 'ssh').pop().href);
}

function writeDecodedSSHKeyFile (filename, b64Data) {
  const buffer = Buffer.from(b64Data, 'base64');
  fs.writeFileSync(filename, buffer.toString('ascii'));
}

async function scanGitHubRepos(config, j1Client, githubOrg) {
  const reportFile = `/tmp/${githubOrg}.json`;

  console.log('start of scan for github org: ' + githubOrg);

  const args = [
    '--config=' + config.gitleaksConfig,
    '--github-org=' + githubOrg,
    '--report=' + reportFile,
    '--redact',
    '--exclude-forks'
  ];

  await scan(args, 'github', j1Client, reportFile);

  console.log('end of scan for github org: ' + githubOrg);
}

/**
 * Run gitleaks scan, convert findings to J1 entities and create them
 * @param {Array} args gitleaks command args
 * @param {string} provider 'github' or 'bitbucket'
 * @param {JupiterOneClient} j1Client
 * @param {string} reportFile path to the gitleaks scan report
 */
async function scan(args, provider, j1Client, reportFile) {
  try {
    await spawn(
      config.gitleaksBinPath,
      args, 
      { logPrefix: 'gitleaks ' });
  } catch (err) {
    console.warn(err);
  }

  if (fs.existsSync(reportFile)) {
    const leaks = JSON.parse(fs.readFileSync(reportFile));
    const entities = await toFindingEntities(leaks, provider, bitbucketOrg);
    console.log(`Ingesting ${entities.length} non-ignored gitleaks findings for ${repoName}`);
    await createEntities(j1Client, entities);
    fs.unlinkSync(reportFile);
  }
}

async function run() {
  console.log('Start of gitleaks scan');

  const config = await gatherConfig();
  const j1Client = 
    await new JupiterOneClient(
      { account: config.j1Account, accessToken: config.j1AccessToken }
    ).init();

  for (const org of config.githubOrgs) {
    await scanGitHubRepos(config, j1Client, org);
  }
  for (const org of config.bitbucketOrgs) {
    await scanBitbucketRepos(config, j1Client, org);
  }

  console.log('End of gitleaks scan');
}

run().catch(console.error);
