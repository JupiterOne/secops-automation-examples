import { fstat } from "fs";
import { BuildPayloadInput } from "./build-payload";
import { getClient } from "./get-client";
import { buildPayload } from "./build-payload";
import { RelationshipForSync } from "@jupiterone/jupiterone-client-nodejs/dist/types";
import { SyncJobStatus } from "@jupiterone/jupiterone-client-nodejs";
import { sleep } from "@lifeomic/attempt";
import { waitForJobFinalization } from "./wait-for-job";

require("dotenv").config();

(async () => {
  const j1Client = await getClient({
    accessToken: process.env.J1_API_TOKEN!,
    account: process.env.J1_ACCOUNT!,
  });

  const results = await j1Client.queryV1(`
  Find (Function|Task) with displayName = 'jupiter-query-service' as f1 
  THAT ASSIGNED AccessRole 
  THAT ASSIGNED AccessPolicy 
  THAT ALLOWS (Function|Task|Database) as f2
  RETURN 
    f1.displayName as sourceName, f1._id as sourceId, f1._class as sourceClass, f1._type as sourceType, f1._key as sourceKey,
    f2.displayName as sinkName, f2._id as sinkId, f2._class as sinkClass, f2._type as sinkType, f2._key as sinkKey`);

  console.log(results);

  const attemptOptions = {
    delay: 5000,
    factor: 1.5,
    maxAttempts: 0,
    maxDelay: 40000,
  };

  const makeVerb = ({ sinkClass }: BuildPayloadInput) => {
    return [sinkClass].flat().includes("Database") ? "ACCESSES" : "EXECUTES";
  };

  const payload = buildPayload({ data: results, verbCb: makeVerb });

  console.log(payload);

  const jobState = await j1Client.bulkUpload({
    scope: "hackathon-2021-relationships-workload-role-policy-workload",
    relationships: payload,
  });

  console.log("Polling for job finalization");
  await waitForJobFinalization(j1Client, jobState.syncJobId);
})().catch((err) => {
  console.error("", err);
});
