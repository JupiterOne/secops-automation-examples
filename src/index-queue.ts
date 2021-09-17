import { getClient } from "./get-client";
import { buildPayload } from "./build-payload";
import { waitForJobFinalization } from "./wait-for-job";
import { WorkloadQueueWorkload } from "./workload-queue-workload-query";
import uniqBy from "lodash.uniqby";

require("dotenv").config();

(async () => {
  const j1Client = await getClient({
    accessToken: process.env.J1_API_TOKEN!,
    account: process.env.J1_ACCOUNT!,
  });

  const results = await WorkloadQueueWorkload.query(j1Client);

  console.log(results);
  console.log(results.length);

  const payload = buildPayload({
    data: results,
    verbCb: WorkloadQueueWorkload.makeVerb,
    relationshipPropsCb: WorkloadQueueWorkload.relationshipPropsCb,
  });

  console.log(payload);

  const jobState = await j1Client.bulkUpload({
    scope: "hackathon-2021-relationships-workload-queue-workload",
    relationships: uniqBy(payload, "_key"),
  });

  console.log("Polling for job finalization");
  await waitForJobFinalization(j1Client, jobState.syncJobId);
})().catch(err => {
  console.error("", err);
});
