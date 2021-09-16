import { fstat } from "fs";
import { BuildPayloadInput } from "./build-payload";
import { getClient } from "./get-client";
import { buildPayload } from "./build-payload";
import { RelationshipForSync } from "@jupiterone/jupiterone-client-nodejs/dist/types";
import { SyncJobStatus } from "@jupiterone/jupiterone-client-nodejs";
import { sleep } from "@lifeomic/attempt";
import { waitForJobFinalization } from "./wait-for-job";
import { WorkloadAccessExecute } from "./workload-access-execute-query";

require("dotenv").config();

(async () => {
  const j1Client = await getClient({
    accessToken: process.env.J1_API_TOKEN!,
    account: process.env.J1_ACCOUNT!,
  });

  const results = await WorkloadAccessExecute.query(j1Client);

  //console.log(results);

  const attemptOptions = {
    delay: 5000,
    factor: 1.5,
    maxAttempts: 0,
    maxDelay: 40000,
  };

  const payload = buildPayload({
    data: results,
    verbCb: WorkloadAccessExecute.makeVerb,
    relationshipPropsCb: WorkloadAccessExecute.relationshipPropsCb,
  });

  console.log(payload);

  const jobState = await j1Client.bulkUpload({
    scope: "hackathon-2021-relationships-workload-role-policy-workload",
    relationships: payload,
  });

  console.log("Polling for job finalization");
  await waitForJobFinalization(j1Client, jobState.syncJobId);
})().catch(err => {
  console.error("", err);
});
