import { getFormattedErrors, hasRejections } from '../utils/promise-allsettled-helpers';
import { insertMetricValueByExternalId } from '../client/compass';
import { MetricsEventPayload } from '../types';

export const insertMetricValues = async (metricsPayload: MetricsEventPayload, cloudId: string): Promise<void> => {
  const startTime = Date.now();
  const { projectID, metrics } = metricsPayload;

  console.log({
    message: 'Sending metrics to compass.',
    metricsCount: metrics.length,
    projectID,
    cloudId,
  });

  const settledResult = await Promise.allSettled(
    metrics.map(async (metric) => {
      await insertMetricValueByExternalId(cloudId, projectID, metric);
    }),
  );

  if (hasRejections(settledResult)) {
    throw new Error(`Error inserting metric values: ${getFormattedErrors(settledResult)}`);
  }

  console.log({
    message: 'insertMetricValues finished.',
    duration: Date.now() - startTime,
  });
};
