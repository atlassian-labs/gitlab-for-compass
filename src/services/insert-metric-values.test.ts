/* eslint-disable import/first, import/order */
import { mockAgg, mockInsertMetricValueByExternalId } from '../__tests__/helpers/mock-agg';

mockAgg();
import { insertMetricValues } from './insert-metric-values';
import { MOCK_CLOUD_ID } from '../__tests__/fixtures/gitlab-data';
import { generateMetric, generateMetricInput } from '../__tests__/helpers/gitlab-helper';
import { BuiltinMetricDefinitions } from '@atlassian/forge-graphql';

const MOCK_METRIC_INPUT = generateMetricInput([
  generateMetric(BuiltinMetricDefinitions.WEEKLY_DEPLOYMENT_FREQUENCY_28D),
]);

describe('insertMetricValues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts metric values', async () => {
    await insertMetricValues(MOCK_METRIC_INPUT, MOCK_CLOUD_ID);

    expect(mockInsertMetricValueByExternalId).toHaveBeenCalledWith({
      cloudId: MOCK_CLOUD_ID,
      externalMetricSourceId: MOCK_METRIC_INPUT.projectID,
      metricDefinitionId: MOCK_METRIC_INPUT.metrics[0].metricAri,
      value: {
        value: MOCK_METRIC_INPUT.metrics[0].value,
        timestamp: MOCK_METRIC_INPUT.metrics[0].timestamp,
      },
    });

    expect(mockInsertMetricValueByExternalId).toHaveBeenCalledTimes(1);
  });
});
