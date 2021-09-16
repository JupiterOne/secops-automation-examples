import { getClient } from "./get-client";

require("dotenv").config();

(async () => {
  const j1Client = await getClient({
    accessToken: process.env.J1_API_TOKEN,
    account: process.env.J1_ACCOUNT,
  });

  const result = await j1Client.queryV1(`
  Find (Function|Task) with displayName = 'jupiter-query-service' as f1 
  THAT ASSIGNED AccessRole 
  THAT ASSIGNED AccessPolicy 
  THAT ALLOWS (Function|Task|DataStore) as f2
  RETURN f1.displayName as source, f2.displayName as sink`);

  console.log(result);
})().catch((err) => {
  console.error("", err);
});
