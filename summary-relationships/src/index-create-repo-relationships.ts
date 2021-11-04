import { getClient } from "./get-client";
import { getDeployDependencies } from "./get-deploy-dependencies";
import { RelationshipForSync } from "@jupiterone/jupiterone-client-nodejs/dist/types";
import { waitForJobFinalization } from "./wait-for-job";
import 'dotenv/config';

function buildRepoQuery(depRepos: string[]): string {
  let query = `FIND CodeRepo WITH tag.AccountName='JupiterOne' AND (`;
  for (let i = 0; i < depRepos.length; i++) {
    if (i === depRepos.length - 1) {
      query = query.concat(`displayName="${depRepos[i]}")`);
    } else {
      query = query.concat(`displayName="${depRepos[i]}" OR `);
    }
  }
  return query;
}

(async () => {
  const j1Client = await getClient({
    accessToken: process.env.J1_API_TOKEN!,
    account: process.env.J1_ACCOUNT!,
  });

  const { dependencyRepos, repoDependencyMappings } = await getDeployDependencies();

  const mainRepos = repoDependencyMappings.map((mapping) => mapping.repo);

  const depRepoQuery = buildRepoQuery(dependencyRepos);
  const allDepRepos = await j1Client.queryV1(depRepoQuery);
  const mainRepoQuery = buildRepoQuery(mainRepos);
  const allMainRepos = await j1Client.queryV1(mainRepoQuery);

  let payload: RelationshipForSync[] = [];
  for (const mapping of repoDependencyMappings) {
    const { repo, dependencies } = mapping;
    const mainRepo = allMainRepos.find(
      (mainRepo) => mainRepo.entity.displayName === repo
    );
    const depRepos = allDepRepos.filter((repo) =>
      dependencies.includes(repo.entity.displayName)
    );
    for (const dep of depRepos) {
      if (mainRepo) {
        const relationshipKey =
          mainRepo.entity._key + "|uses|" + dep.entity._key;
        const relationship: RelationshipForSync = {
          _key: relationshipKey,
          _class: "USES",
          _type: "repo_dependency",
          _fromEntityId: mainRepo.entity._id,
          _toEntityId: dep.entity._id,
          summaryRelationship: true,
        };
        payload.push(relationship);
        console.log(
          `Successfully pushed relationship ${repo} USES ${dep.entity.displayName} to payload for bulk upload.`
        );
      } else {
        console.log(
          `Failed to create relationship with ${dep.entity.displayName}. Skipped.`
        );
      }
    }
  }

  console.log(payload);

  const jobState = await j1Client.bulkUpload({
    scope: "summary-relationships-code-repo-dependencies-workload",
    relationships: payload,
  });

  console.log("Polling for job finalization");
  await waitForJobFinalization(j1Client, jobState.syncJobId);
})().catch((err) => {
  console.error("", err);
});
