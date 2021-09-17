import { JupiterOneClient } from "@jupiterone/jupiterone-client-nodejs";
import { BuildPayloadInput } from "./build-payload";

export interface IWorkloadQueueWorkload extends BuildPayloadInput {
  queueName: string;
  queueId: string;
  queueClass: string;
  queueKey: string;
  queueType: string;
}

export class WorkloadQueueWorkload {
  public static async query(
    client: JupiterOneClient,
  ): Promise<IWorkloadQueueWorkload[]> {
    const results: IWorkloadQueueWorkload[] = await client.queryV1(`
    Find (Function|Task|Workload) as f1 
    THAT ASSIGNED >> AccessRole THAT ASSIGNED AccessPolicy 
    THAT ALLOWS >> (Queue|Channel) as q 
    THAT ALLOWS >> AccessPolicy THAT ASSIGNED AccessRole 
    THAT ASSIGNED >> (Function|Task|Workload) as f2 WHERE f1.displayName != f2.displayName
    RETURN
    f1.displayName as sourceName, f1._id as sourceId, f1._class as sourceClass, f1._type as sourceType, f1._key as sourceKey,
    f2.displayName as sinkName, f2._id as sinkId, f2._class as sinkClass, f2._type as sinkType, f2._key as sinkKey,
    q.displayName as queueName, q._id as queueId, q._class as queueClass, q._type as queueType, q._key as queueKey`);

    return results;
  }

  public static async queryV2(
    client: JupiterOneClient,
  ): Promise<IWorkloadQueueWorkload[]> {
    const results: IWorkloadQueueWorkload[] = await client.queryV1(`
    Find (Function|Task|Workload) as f1 
    THAT ASSIGNED AccessRole THAT ASSIGNED AccessPolicy 
    THAT ALLOWS as a1 (Queue|Channel) as q 
    THAT ALLOWS AccessPolicy THAT ASSIGNED AccessRole 
    THAT ASSIGNED (Function|Task|Workload) as f2 
    WHERE a1.execute=true AND a1.read=false
    RETURN
    f1.displayName as sourceName, f1._id as sourceId, f1._class as sourceClass, f1._type as sourceType, f1._key as sourceKey,
    f2.displayName as sinkName, f2._id as sinkId, f2._class as sinkClass, f2._type as sinkType, f2._key as sinkKey,
    q.displayName as queueName, q._id as queueId, q._class as queueClass, q._type as queueType, q._key as queueKey`);

    const ret: IWorkloadQueueWorkload[] = results.flatMap(original => {
      const {
        queueClass,
        queueId,
        queueKey,
        queueName,
        queueType,
        sinkClass,
        sinkId,
        sinkKey,
        sinkType,
        sourceId,
        sourceKey,
        sourceType,
        sourceClass,
      } = original;

      const one: IWorkloadQueueWorkload = {
        queueClass,
        queueId,
        queueKey,
        queueName,
        queueType,
        sinkClass: queueClass,
        sinkId: queueId,
        sinkKey: queueKey,
        sinkType: queueType,
        sourceId,
        sourceKey,
        sourceType,
        sourceClass,
      };

      const two: IWorkloadQueueWorkload = {
        queueClass,
        queueId,
        queueKey,
        queueName,
        queueType,
        sinkClass,
        sinkId,
        sinkKey,
        sinkType,
        sourceId: queueId,
        sourceKey: queueKey,
        sourceType: queueType,
        sourceClass: queueClass,
      };

      return [one, two];
    });

    return ret;
  }

  public static makeVerb(input: IWorkloadQueueWorkload): string {
    return "QUEUES";
  }

  public static makeVerbV2(input: IWorkloadQueueWorkload): string {
    return "ASYNC_NOTIFIES";
  }
  public static relationshipPropsCb({
    queueName,
    queueType,
  }: IWorkloadQueueWorkload): Record<string, string> {
    return {
      name: queueName,
      type: queueType,
    };
  }
}
