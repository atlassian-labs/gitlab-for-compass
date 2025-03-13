import { Queue } from '@forge/events';
import { WebtriggerRequest } from '../../types';
import { isCompassPushEventEnabled } from '../../services/feature-flags';

export default async function dataProviderBackfill(req: WebtriggerRequest): Promise<void> {
  const queue = new Queue({ key: 'data-provider-backfill' });

  if (!isCompassPushEventEnabled()) {
    console.log('Compass push event is not enabled');
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
