const fs = require('fs');

async function main(pathToSBOM) {
  const dependencies = getSBOMComponents(pathToSBOM).filter(c => c.type === 'library');
  for (const dependency of dependencies) {
    const { purl, name, licenses, version } = dependency;
    console.log({name, purl, license: licenses[0].license.id, version});
  }
}

function getSBOMComponents(pathToSBOM) {
  let sbomData;
  try {
    sbomData = JSON.parse(fs.readFileSync(pathToSBOM, {encoding: 'utf8'}));
  } catch (err) {
    console.warn(`Couldn't parse ${pathToSBOM} as JSON: ${err}`);
    sbomData = {};
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

function die(msg, rc=1) {
  console.error(msg);
  process.exit(rc);
}

main(pathToSBOM).catch(console.error);