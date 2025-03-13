import {
  CompassBuildEventState,
  CompassDeploymentEventEnvironmentCategory,
  CompassDeploymentEventState,
  DataProviderBuildEvent,
  DataProviderDeploymentEvent,
} from '@atlassian/forge-graphql';
import { BackfillData } from '../../entry/data-provider/types';

export const MOCK_BUILD_EVENT: DataProviderBuildEvent = {
  pipeline: {
    pipelineId: 'pipeline-id',
  },
  startedAt: 'started-at',
  completedAt: 'completed-at',
  state: CompassBuildEventState.Successful,
  description: 'mock description',
  displayName: 'mock display name',
  updateSequenceNumber: 1,
  lastUpdated: 'updated',
  url: 'url',
};

export const MOCK_DEPLOY_EVENT: DataProviderDeploymentEvent = {
  displayName: 'name',
  lastUpdated: 'mock',
  updateSequenceNumber: '1',
  url: 'url',
  environment: {
    category: CompassDeploymentEventEnvironmentCategory.Production,
    displayName: 'prod',
    environmentId: 'id',
  },
  pipeline: { pipelineId: '1', displayName: 'pipeline', url: 'url' },
  sequenceNumber: 1,
  state: CompassDeploymentEventState.Successful,
};

export const MOCK_BACKFILL_RESPONSE = {
  builds: [MOCK_BUILD_EVENT],
  deployments: [MOCK_DEPLOY_EVENT],
  metrics: {
    mrCycleTime: 1,
    openMergeRequestsCount: 3,
  },
} as BackfillData;

export const MOCK_EMPTY_BACKFILL_RESPONSE = {
  builds: [],
  deployments: [],
  metrics: {
    mrCycleTime: null,
    openMergeRequestsCount: null,
  },
} as BackfillData;
