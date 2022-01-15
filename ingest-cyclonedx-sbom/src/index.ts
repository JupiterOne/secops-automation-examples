import * as fs from "fs";
import { retry } from "@lifeomic/attempt";
import { JupiterOneClient } from '@jupiterone/jupiterone-client-nodejs';
import { J1Dependency, SBOM, SBOMComponent } from "./types";

/* eslint-disable @typescript-eslint/no-use-before-define */
async function run (pathToSBOM, repoName): Promise<void> {
  const SBOMComponents = await getSBOMComponents(pathToSBOM);

  const j1Client = await new JupiterOneClient({
    account: process.env.J1_ACCOUNT,
    accessToken: process.env.J1_API_TOKEN,
    dev: false
  }).init();

  console.log('Gathering CodeRepo data from JupiterOne...');
  const codeRepoIdMap = await getCodeRepoIdMap(j1Client);

  const codeRepoEntityId = codeRepoIdMap[repoName];
  if (!codeRepoEntityId) {
    die(`ERROR: ${repoName} doesn't appear to be a CodeRepo known to JupiterOne!`, 3);
  }

  const npmPackageIdMap = await getNPMPackageIdMap(j1Client);
  console.log(`${Object.keys(codeRepoIdMap).length} coderepos found in J1`);
  console.log(`${Object.keys(npmPackageIdMap).length} NPM packages found in J1`);


  const attemptOptions = {
    delay: 20000,
    factor: 1.5,
    maxAttempts: 0,
    maxDelay: 70,
    beforeAttempt (context, options): void {
      console.log(`attempt number ${context.attemptNum}...`);
    }
  };

  for (const component of SBOMComponents) {
    let res: any;
    let packageId = npmPackageIdMap[component.purl];

    if (!packageId) {

      const dependencyProps: J1Dependency = {
        displayName: component.purl,
        fullName: component.purl,
        name: component.name,
        license: component.licenses[0].license.id,
        scope: component.group,
        version: component.version
      };

      // e.g. pkg:npm/commander@8.3.0 ingests as type 'npm_package'
      const j1Type = component.purl.split('/')[0].split(':')[1] + '_package';
      console.log(`Creating CodeModule entity for ${component.name} ${j1Type} in J1...`);
      res = await retry(() => {
        return j1Client.createEntity(
          `${j1Type}:${component.name}`, //_key
          j1Type, //_type
          [ 'CodeModule' ], //_class
          dependencyProps
        );
      }, attemptOptions);
      packageId = res.vertex.entity._id;
    }
    console.log(`Creating ${repoName} -USES-> ${component.name} relationship in J1...`);
    res = await retry(() => {
      return j1Client.createRelationship(
        `${codeRepoEntityId}:USES:${packageId}`, //_key
        'coderepo_uses_codemodule', //_type
        'USES', //_class
        codeRepoEntityId, //fromId
        packageId, //toId
        {
          displayName: `${repoName}:USES:${component.name}`,
          version: component.version,
        }
      );
    }, attemptOptions);
  }

  console.log(`${SBOMComponents.length} dependencies ingested.`)
}

async function getCodeRepoIdMap (j1Client: JupiterOneClient): Promise<object> {
  const cacheFile = `/tmp/codeRepoIdMap-${process.env.J1_ACCOUNT}.json`;
  if (fs.existsSync(cacheFile) && !process.env.NOCACHE_J1_QUERIES) {
    return require(cacheFile);
  }

  const repos = await j1Client.queryV1('Find CodeRepo as c return c.name as name, c._id as id');
  const map = {};
  repos.forEach(repo => {
    map[repo.name] = repo.id;
  });

  fs.writeFileSync(cacheFile, JSON.stringify(map), 'utf8');
  return map;
}

async function getNPMPackageIdMap (j1Client: JupiterOneClient, shouldCache = false): Promise<object> {
  const cacheFile = `/tmp/codeModuleIdMap-${process.env.J1_ACCOUNT}.json`;
  if (shouldCache && fs.existsSync(cacheFile) && !process.env.NOCACHE_J1_QUERIES) {
    return require(cacheFile);
  }

  const repos = await j1Client.queryV1('Find npm_package as p return p.id as name, p._id as id');
  const map = {};
  repos.forEach(repo => {
    map[repo.name] = repo.id;
  });

  if (shouldCache) {
    fs.writeFileSync(cacheFile, JSON.stringify(map), 'utf8');
  }
  return map;
}

function die(msg, rc=1): void {
  console.error(msg);
  process.exit(rc);
}

function getSBOMComponents(pathToSBOM): SBOMComponent[] {
  let sbomData: SBOM;
  try {
    sbomData = require(pathToSBOM);
  } catch (err) {
    console.warn(`Couldn't parse ${pathToSBOM} as JSON: ${err}`);
    sbomData = { bomFormat: undefined } as unknown as SBOM;
  }
  if (! (sbomData.bomFormat === 'CycloneDX')) {
    die(`${pathToSBOM} does not appear to be a valid CycloneDX file, aborting!`);
  }
  const { components } = sbomData;
  return Array.isArray(components) ? components : [];
}

const pathToSBOM = process.argv[2];
if (!pathToSBOM || !fs.existsSync(pathToSBOM)) {
  die('You must provide a valid path to a CycloneDX bom.json file!', 2);
}

const repoName = process.argv[3];
if (!repoName) {
  die('You must provide a repo name parameter specifying the CodeRepo to ingest the SBOM for!', 2);
}

if (!process.env.J1_API_TOKEN) {
  die('Missing J1_API_TOKEN ENV Var!');
}

if (!process.env.J1_ACCOUNT) {
  die('Missing J1_ACCOUNT ENV Var!');
}

run(pathToSBOM, repoName).catch(console.error);
