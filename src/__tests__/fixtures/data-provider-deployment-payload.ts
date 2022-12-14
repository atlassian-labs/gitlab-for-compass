import {
  CompassDeploymentEventEnvironmentCategory,
  CompassDeploymentEventState,
  DataProviderDeploymentEvent,
} from '@atlassian/forge-graphql';

export const createMockDataProviderDeployment = (
  daysFromNow: number,
  environment = 'production',
): DataProviderDeploymentEvent => ({
  environment: {
    category: environment.toUpperCase() as CompassDeploymentEventEnvironmentCategory,
    displayName: environment,
    environmentId: '1234',
  },
  pipeline: {
    displayName: 'koko pipeline',
    pipelineId: '2345',
    url: 'https://koko.momo',
  },
  sequenceNumber: 1,
  state: CompassDeploymentEventState.Successful,
  description: 'koko deployment',
  displayName: 'koko',
  lastUpdated: new Date(new Date('2022-01-29T01:15:42.960Z').valueOf() - 1000 * 86400 * daysFromNow).toISOString(),
  updateSequenceNumber: new Date(new Date('2022-01-29T01:15:42.960Z').valueOf() - 1000 * 86400 * daysFromNow).getTime(),
  url: 'https://koko.momo',
});
