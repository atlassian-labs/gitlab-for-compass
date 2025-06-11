import { Queue } from '@forge/events';
import { FileData, Queues } from '../types';

export const resyncConfigAsCode = async (cloudId: string, fileData: FileData[]): Promise<void> => {
  const queue = new Queue({ key: Queues.RESYNC_CAC });

  const jobIds = [];
  for (const data of fileData) {
    const jobId = await queue.push({ cloudId, data }, { delayInSeconds: 2 });
    jobIds.push(jobId);
  }
};
