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
  THAT ALLOWS (Function|Task|Database) as f2
  RETURN 
    f1.displayName as sourceName, f1._id as sourceId, f1._class as sourceClass, f1._type as sourceType,
    f2.displayName as sinkName, f2._id as sinkId, f2._class as sinkClass, f2._type as sinkType`);

  console.log(result);
})().catch((err) => {
  console.error("", err);
});
