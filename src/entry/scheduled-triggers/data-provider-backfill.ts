import { Queue } from '@forge/events';
import { storage } from '@forge/api';
import { WebtriggerRequest } from '../../types';
import { isCompassPushEventEnabled } from '../../services/feature-flags';
import { STORAGE_KEYS } from '../../constants';

export const CURRENT_BACKFILL_VERSION = 1;

const getBackfillVersion = async (): Promise<number> => {
  return (await storage.get(STORAGE_KEYS.BACKFILL_PUSH_DATA_PROVIDER_VERSION)) || 0;
};

export default async function dataProviderBackfill(req: WebtriggerRequest): Promise<void> {
  const queue = new Queue({ key: 'data-provider-backfill' });

  if (!isCompassPushEventEnabled()) {
    console.warn('Compass push event is not enabled');
    return;
  }

  const backfillVersion = await getBackfillVersion();
  if (backfillVersion >= CURRENT_BACKFILL_VERSION) {
    // eslint-disable-next-line no-console
    console.log(`Skipping backfill as it already has the latest version (v${backfillVersion})`);
    return;
  }

  // space out the requests over 15 mins because they all get triggered at the same time
  const queueDelayInSeconds = Math.floor(Math.random() * 900);
  await queue.push(
    {
      cloudId: req.context.cloudId,
    },
    {
      delayInSeconds: queueDelayInSeconds,
    },
  );
}
