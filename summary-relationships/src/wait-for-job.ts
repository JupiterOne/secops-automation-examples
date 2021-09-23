import {
  JupiterOneClient,
  SyncJobResponse,
  SyncJobStatus,
} from "@jupiterone/jupiterone-client-nodejs";
import { sleep } from "@lifeomic/attempt";

export const waitForJobFinalization = async (
  j1Client: JupiterOneClient,
  id: string
): Promise<boolean> => {
  let status: SyncJobResponse;

  do {
    status = await j1Client.fetchSyncJobStatus({
      syncJobId: id,
    });

    await sleep(1000);
  } while (status.job.status !== SyncJobStatus.FINISHED);
  return true;
};
