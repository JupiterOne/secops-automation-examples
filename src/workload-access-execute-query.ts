import { JupiterOneClient } from "@jupiterone/jupiterone-client-nodejs";
import { BuildPayloadInput } from "./build-payload";

export interface IWorkloadAccessExecute extends BuildPayloadInput {
  roleName: string;
  policyName: string;
}

export class WorkloadAccessExecute {
  public static async query(
    client: JupiterOneClient,
  ): Promise<IWorkloadAccessExecute[]> {
    const results = await client.queryV1(`
  Find (Function|Task) with displayName='jupiter-query-service' as f1 
  THAT ASSIGNED AccessRole as ar
  THAT ASSIGNED AccessPolicy as ap
  THAT ALLOWS (Function|Task|Database) as f2
  RETURN 
    f1.displayName as sourceName, f1._id as sourceId, f1._class as sourceClass, f1._type as sourceType, f1._key as sourceKey,
    f2.displayName as sinkName, f2._id as sinkId, f2._class as sinkClass, f2._type as sinkType, f2._key as sinkKey,
    ar.displayName as roleName,
    ap.displayName as policyName`);

    return results;
  }

  public static makeVerb(input: IWorkloadAccessExecute): string {
    return [input.sinkClass].flat().includes("Database")
      ? "ACCESSES"
      : "EXECUTES";
  }
  public static relationshipPropsCb({
    roleName,
    policyName,
  }: IWorkloadAccessExecute): Record<string, string> {
    return {
      roleName,
      policyName,
    };
  }
}
