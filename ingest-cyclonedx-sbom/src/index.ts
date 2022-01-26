import * as fs from "fs";
import { retry } from "@lifeomic/attempt";
import { JupiterOneClient } from '@jupiterone/jupiterone-client-nodejs';
import { J1Dependency, J1UsesRelationship, SBOM, SBOMComponent } from "./types";
import minimist from "minimist";

/* eslint-disable 
  @typescript-eslint/no-use-before-define,
  @typescript-eslint/no-explicit-any, 
*/

function usage(): void {
  console.log(`${process.argv[0]} --sbom <path> --repo <string> [--devDeps <path>] [--directDeps <path>]`);
  console.log('  --sbom  path to sbom file to ingest');
  console.log('  --repo  name of coderepo ingest ');
  console.log('  (optional) --devDeps path to json file array of dev dependencies');
  console.log('  (optional) --directDeps path to json file array of direct dependencies');
}

async function run (
  pathToSBOM: string, 
  repoName: string,
  devDependencies: string[],
  directDependencies: string[]
): Promise<void> {
  const SBOMComponents = await getSBOMComponents(pathToSBOM);

  const j1Client = await initJ1Client();

  console.log('Gathering CodeRepo data from JupiterOne...');
  const codeRepoIdMap = await getCodeRepoIdMap(j1Client);
  console.log(`${Object.keys(codeRepoIdMap).length} coderepos found in J1`);

  const codeRepoEntityId = codeRepoIdMap[repoName];
  if (!codeRepoEntityId) {
    die(`ERROR: ${repoName} doesn't appear to be a CodeRepo known to JupiterOne!`, 3);
  }

  console.log('Gathering CodeModule data from JupiterOne...');
  const codeModuleIdMap = await getCodeModuleIdMap(j1Client);
  console.log(`${Object.keys(codeModuleIdMap).length} CodeModules found in J1`);

  for (const component of SBOMComponents) {
    let res: any;
    const purl = getPurl(component);
    let packageId = codeModuleIdMap[purl];

    if (!packageId) {

      const dependencyProps: J1Dependency = {
        displayName: component.name,
        fullName: purl,
        name: component.name,
        purl,
        license: getLicense(component),
        scope: component.group,
        version: component.version,
        from: `ingest-cyclonedx-sbom-${repoName}`
      };

      // e.g. pkg:npm/commander@8.3.0 ingests as type 'npm_package'
      const j1Type = getType(component);

      process.stdout.write(`Creating CodeModule entity for ${purl} ${j1Type} in J1..`);
      res = await retry(() => {
        return j1Client.createEntity(
          `${j1Type}:${component.name}`, //_key
          j1Type, //_type
          [ 'CodeModule' ], //_class
          dependencyProps
        );
      }, attemptOptions);
      console.log(' ok');
      packageId = res.vertex.entity._id;
    }

    process.stdout.write(`Creating ${repoName}:USES:${component.name} relationship in J1..`);

    const relationshipProps: J1UsesRelationship = {
      displayName: `${repoName}:USES:${component.name}`,
      version: component.version,
    };

    // normalize component name for lookup in optional hint arrays
    const normalizedComponentName = component.group ? component.group + '/' + component.name : component.name;

    if (devDependencies.length) {
      relationshipProps.devDependency = devDependencies.includes(normalizedComponentName);
    }

    if (directDependencies.length) {
      relationshipProps.directDependency = directDependencies.includes(normalizedComponentName);
    }

    res = await retry(() => {
      return j1Client.createRelationship(
        `${codeRepoEntityId}:USES:${packageId}`, //_key
        'coderepo_uses_codemodule', //_type
        'USES', //_class
        codeRepoEntityId, //fromId
        packageId, //toId
        relationshipProps
      );
    }, attemptOptions);
    console.log(' ok');
  }

  console.log(`${SBOMComponents.length} dependencies ingested.`)
}

function getLicense(component: SBOMComponent): string {
  let license;
  try {
    license = component.licenses[0].license.id;
  } catch {
    license = 'Unknown';
  }
  return license;
}

function getType(component: SBOMComponent): string {
  let j1Type;
  try {
    // e.g. pkg:npm/foo@0.0.1 -> npm_package
    j1Type = component.purl.split('/')[0].split(':')[1] + '_package';
  } catch {
    j1Type = 'unknown_package';

  }
  return j1Type;
}

function getPurl(component: SBOMComponent): string {
  // url-decode '@' chars
  return component.purl.replace(/%40/g, '@');
}

async function initJ1Client(): Promise<JupiterOneClient> {
  return new JupiterOneClient({
    account: process.env.J1_ACCOUNT,
    accessToken: process.env.J1_API_TOKEN,
    dev: !!(process.env.J1_DEV_ENABLED)
  }).init();
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

async function getCodeModuleIdMap (j1Client: JupiterOneClient, shouldCache = false): Promise<object> {
  const cacheFile = `/tmp/codeModuleIdMap-${process.env.J1_ACCOUNT}.json`;
  if (shouldCache && fs.existsSync(cacheFile) && !process.env.NOCACHE_J1_QUERIES) {
    return require(cacheFile);
  }

  const modules = await j1Client.queryV1('Find CodeModule as m return m.id as name, m._id as id');
  const map = {};
  modules.forEach(module => {
    map[module.name] = module.id;
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
    sbomData = JSON.parse(fs.readFileSync(pathToSBOM, {encoding: 'utf8'}));
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

const { sbom, repo, devDeps, directDeps } = minimist(process.argv.slice(2));

if (!sbom || !fs.existsSync(sbom)) {
  usage();
  die('You must provide a valid path to a CycloneDX bom.json file!', 2);
}

if (!repo) {
  usage();
  die('You must provide a repo name parameter specifying the CodeRepo to ingest the SBOM for!', 2);
}

const devDependencies = devDeps ? JSON.parse(fs.readFileSync(devDeps, {encoding: 'utf8'})) : [];
const directDependencies = directDeps ? JSON.parse(fs.readFileSync(directDeps, {encoding: 'utf8'})) : [];

if (!process.env.J1_API_TOKEN) {
  die('Missing J1_API_TOKEN ENV Var!');
}

if (!process.env.J1_ACCOUNT) {
  die('Missing J1_ACCOUNT ENV Var!');
}

const attemptOptions = {
  delay: 20000,
  factor: 1.5,
  maxAttempts: 0,
  maxDelay: 70,
  beforeAttempt (): void {
    process.stdout.write('.');
  }
};

run(sbom, repo, devDependencies, directDependencies).catch(console.error);
