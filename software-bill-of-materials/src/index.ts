import * as fs from "fs-extra";
import path from "path";

const JupiterOneClient = require("@jupiterone/jupiterone-client-nodejs");

if (!process.env.J1_API_TOKEN) {
  throw new Error('Missing J1_API_TOKEN ENV Var!');
}

if (!process.env.J1_ACCOUNT) {
  throw new Error('Missing J1_ACCOUNT ENV Var!');
}

export type Component = {
  type: string;
  'bom-ref': string;
  name: string;
  version: string;
  description: string;
  licenses: {
    license: {
      id: string;
    }
  }[];
  purl: string;
  externalReferences: [];
  scope: string;
};

export type CodeModuleEntity = {
  entity: {
    _type: string[];
    _class: string[];
  }
  properties: {
    name: string;
    license: string;
    version: string;
    purl?: string;
  }
};

async function run (): Promise<void> {
  const j1Client = await new JupiterOneClient({
    account: process.env.J1_ACCOUNT,
    accessToken: process.env.J1_API_TOKEN,
    dev: false
  }).init();

  const j1ql = process.argv[2] || 'Find CodeModule with license!=undefined and version!=undefined THAT USES CodeRepo';
  console.log(`searching J1 with: "${j1ql}"...`);
  const modules: CodeModuleEntity[] = await j1Client.queryV1(j1ql);
  console.log(`found ${modules.length} CodeModules in J1...`);

  const components: Component[] = [];

  for (const module of modules) {
    const { name, version, license, purl } = module?.properties;

    // account for possibly missing purl data
    const moduleType = module.entity._type[0].split('_')[0]; // e.g. ['npm_package'] -> 'npm'
    const fallBackPurl = `pkg:${moduleType}/${name}@${version}`;

    components.push({
      type: 'library',
      'bom-ref': purl || fallBackPurl,
      name,
      version,
      description: '',
      licenses: [{
        license: {
          id: license
        }
      }],
      purl: purl || fallBackPurl,
      externalReferences: [],
      scope: 'required'
    });
  }

  const bom = JSON.parse(await fs.readFile(path.join(__dirname, '../bom-skeleton.json'), 'utf8'));
  bom.components = components;

  await fs.writeFile('sbom.json', JSON.stringify(bom, null, 2));
  console.log('wrote software bill-of-materials to "sbom.json"');
}

run().catch(console.error);
