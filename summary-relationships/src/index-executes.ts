import { getClient } from "./get-client";
import { buildPayload } from "./build-payload";
import { waitForJobFinalization } from "./wait-for-job";
import { WorkloadAccessExecute } from "./workload-access-execute-query";
const uniqBy = require("lodash.uniqby");

require("dotenv").config();

(async () => {
  const j1Client = await getClient({
    accessToken: process.env.J1_API_TOKEN!,
    account: process.env.J1_ACCOUNT!,
  });

  const results = await WorkloadAccessExecute.query(j1Client);

  const payload = buildPayload({
    data: results,
    verbCb: WorkloadAccessExecute.makeVerb,
    relationshipPropsCb: WorkloadAccessExecute.relationshipPropsCb,
  });

  console.log(payload);

  const jobState = await j1Client.bulkUpload({
    scope: "summary-relationships-workload-role-policy-workload",
    relationships: uniqBy(payload, "_key"),
  });

  console.log("Polling for job finalization");
  await waitForJobFinalization(j1Client, jobState.syncJobId);
})().catch(err => {
  console.error("", err);
});
