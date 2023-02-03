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
import { parse } from '../../utils/parse-ari';
import { GitlabHttpMethodError } from '../../models/errors';

export const dataProvider = async (
  request: DataProviderPayload,
): Promise<DataProviderResult | ForgeInvocationError> => {
  try {
    parse(request.ctx.cloudId);
  } catch {
    console.error('Invalid cloudId.');
    return null;
  }

  const {
    project: { id: projectId, default_branch: defaultBranch, name: projectName },
    groupToken,
  } = await getProjectDataFromUrl(request.url);

  if (!projectId) {
    console.warn('Cannot get GitLab project data by provided link.');
    return null;
  }

  const trackingBranch = await getTrackingBranchName(groupToken, projectId, defaultBranch);

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
