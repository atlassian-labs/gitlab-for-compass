import {
  BuiltinMetricDefinitions,
  DataProviderEventTypes,
  DataProviderResponse,
  DataProviderResult,
  ForgeInvocationError,
  ForgeInvocationErrorResponse,
  InvocationStatusCode,
} from '@atlassian/forge-graphql';

import { BackfillData, DataProviderPayload } from './types';
import { getProjectDataFromUrl } from '../../services/data-provider-link-parser';
import { getTrackingBranchName } from '../../services/get-tracking-branch';
import { getBackfillData } from '../../services/get-backfill-data';
import { GitlabHttpMethodError } from '../../models/errors';

export const dataProvider = async (
  request: DataProviderPayload,
): Promise<DataProviderResult | ForgeInvocationError> => {
  let projectId: number;
  let defaultBranch: string;
  let projectName: string;
  let groupToken: string;
  let trackingBranch: string;

  try {
    ({
      project: { id: projectId, default_branch: defaultBranch, name: projectName },
      groupToken,
    } = await getProjectDataFromUrl(request.url));
  } catch (e) {
    console.error(`Error while getting project data from URL in dataProvider ${e}`);
    return null;
  }

  if (!projectId) {
    console.warn('Cannot get GitLab project data by provided link.');
    return null;
  }

  try {
    trackingBranch = await getTrackingBranchName(groupToken, projectId, defaultBranch);
  } catch (e) {
    console.error(`Error while getting tracking branch name in dataProvider ${e}`);

    return null;
  }

  const backfillData: BackfillData = {
    builds: [],
    deployments: [],
    metrics: {
      mrCycleTime: 0,
      openMergeRequestsCount: 0,
    },
  };

  try {
    const {
      builds,
      deployments,
      metrics: { mrCycleTime, openMergeRequestsCount },
    } = await getBackfillData(groupToken, projectId, projectName, trackingBranch);

    backfillData.builds = builds;
    backfillData.deployments = deployments;
    backfillData.metrics.mrCycleTime = mrCycleTime;
    backfillData.metrics.openMergeRequestsCount = openMergeRequestsCount;
  } catch (err) {
    console.log(`data provider error: ${err.message}`);
    const invocationErrorOptions = { backoffTimeInSeconds: 3600 };

    if (err instanceof GitlabHttpMethodError) {
      return new ForgeInvocationErrorResponse(err.statusText, err.status, invocationErrorOptions).build();
    }

    return new ForgeInvocationErrorResponse(
      err.message,
      InvocationStatusCode.INTERNAL_SERVER_ERROR,
      invocationErrorOptions,
    ).build();
  }

  const response = new DataProviderResponse(projectId.toString(), {
    eventTypes: [DataProviderEventTypes.BUILDS, DataProviderEventTypes.DEPLOYMENTS],
    builtInMetricDefinitions: [
      {
        name: BuiltinMetricDefinitions.WEEKLY_DEPLOYMENT_FREQUENCY_28D,
        derived: true,
      },
      {
        name: BuiltinMetricDefinitions.DEPLOYMENT_TIME_AVG_LAST_25,
        derived: true,
      },
      {
        name: BuiltinMetricDefinitions.PULL_REQUEST_CYCLE_TIME_AVG_LAST_10,
        derived: false,
      },
      {
        name: BuiltinMetricDefinitions.BUILD_TIME_AVG_LAST_10,
        derived: true,
      },
      {
        name: BuiltinMetricDefinitions.OPEN_PULL_REQUESTS,
        derived: false,
      },
      {
        name: BuiltinMetricDefinitions.BUILD_SUCCESS_RATE,
        derived: true,
      },
    ],
    customMetricDefinitions: [],
  });

  return response
    .addBuilds(backfillData.builds)
    .addDeployments(backfillData.deployments)
    .addBuiltInMetricValue(
      BuiltinMetricDefinitions.PULL_REQUEST_CYCLE_TIME_AVG_LAST_10,
      backfillData.metrics.mrCycleTime,
    )
    .addBuiltInMetricValue(BuiltinMetricDefinitions.OPEN_PULL_REQUESTS, backfillData.metrics.openMergeRequestsCount)
    .build();
};
