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

  await Promise.all(
    metrics.map(async (metric) => {
      await insertMetricValueByExternalId(cloudId, projectID, metric);
    }),
  );

  console.log({
    message: 'insertMetricValues finished.',
    duration: Date.now() - startTime,
  });
};
