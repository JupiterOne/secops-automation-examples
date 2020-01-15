const highSeverityTags = ['Facebook', 'RSA', 'EC', 'Google', 'Twitter', 'NPM'];
const lowSeverityFilePathFragments = ['test', 'fixture', 'snapshot'];

async function convertJson (gitleaksJson, source, org) {
  let repoName = gitleaksJson.repo;
  if (gitleaksJson.repo.indexOf('.git') > -1) {
    repoName = gitleaksJson.repo.slice(0, -4); // remove .git suffix, if present
  }

  const newEntity = {
    entityKey: `gitleaks-finding-${repoName}-${gitleaksJson.commit}`,
    entityType: 'gitleaks_finding',
    entityClass: 'Finding',
    properties: gitleaksJson
  };

  const ignorable = lowSeverityFilePathFragments.some(fragment => {
    if (gitleaksJson.file.toLowerCase().indexOf(fragment) > -1) {
      return true;
    }
  });

  if (ignorable) {
    return undefined;
  }

  newEntity.properties.severity = 'medium';

  const highSeverity = highSeverityTags.some(sevTag => {
    if (gitleaksJson.tags.indexOf(sevTag) > -1) {
      return true;
    }
  });

  if (highSeverity) {
    newEntity.properties.severity = 'high';
  }

  newEntity.properties.name = `${repoName}-${gitleaksJson.rule}`;
  newEntity.properties.displayName = `${repoName}-${gitleaksJson.rule}`;
  newEntity.properties.repo = repoName;
  newEntity.properties.targets = repoName;

  if (source === 'github') {
    newEntity.properties.coderepo_type = 'github_repo';
    newEntity.properties.webLink = 'https://github.com/' +
      org + '/' +
      repoName +
      '/tree/' +
      gitleaksJson.commit + '/' +
      gitleaksJson.file;
  } else if (source === 'bitbucket') {
    newEntity.properties.coderepo_type = 'bitbucket_repo';
    newEntity.properties.webLink = 'https://bitbucket.org/' +
      org + '/' +
      repoName +
      '/src/' +
      gitleaksJson.commit + '/' +
      gitleaksJson.file;
  }

  return newEntity;
}

async function convertLeaks (gitleaks, source, org) {
  const entities = [];
  for (const obj of gitleaks) {
    const entity = await convertJson(obj, source, org);
    if (entity) {
      entities.push(entity);
    }
  }
  return entities;
}

async function createEntities (j1Client, entities) {
  for (const e of entities) {
    const classLabels = Array.isArray(e.entityClass)
      ? e.entityClass
      : [e.entityClass];

    e.properties.createdOn = e.properties.createdOn
      ? new Date(e.properties.createdOn).getTime()
      : new Date().getTime();

    await j1Client.createEntity(
      e.entityKey,
      e.entityType,
      classLabels,
      e.properties
    );
  }
}

module.exports = {
  createEntities,
  convertLeaks
};
