import { CompassEventType } from '@atlassian/forge-graphql';
import { getBackfillData } from './get-backfill-data';

import * as getProjectBuildsFor28Days from './compute-event-and-metrics/get-recent-builds';
import * as getDeploymentsForEnvironmentTiers from './compute-event-and-metrics/get-recent-deployments';
import * as getMRCycleTime from './compute-event-and-metrics/get-mr-cycle-time';
import * as getOpenMergeRequestsCount from './compute-event-and-metrics/get-open-merge-requests';
import { MOCK_BUILD_EVENT, MOCK_DEPLOY_EVENT } from './__mocks__/mocks';

const getBuildsSpy = jest.spyOn(getProjectBuildsFor28Days, 'getProjectBuildsFor28Days');
const getCycleTimeSpy = jest.spyOn(getMRCycleTime, 'getMRCycleTime');
const getDeploymentsSpy = jest.spyOn(getDeploymentsForEnvironmentTiers, 'getDeploymentsForEnvironmentTiers');
const getOpenMergeRequestsSpy = jest.spyOn(getOpenMergeRequestsCount, 'getOpenMergeRequestsCount');

const MOCK_PROJECT_ID = 12345;

describe('get backfill data', () => {
  const nonBackfillEvents = Object.values(CompassEventType).filter(
    (eventType) =>
      ![CompassEventType.Build, CompassEventType.Deployment, CompassEventType.PullRequest].includes(eventType),
  );

  beforeEach(() => {
    jest.clearAllMocks();
    getBuildsSpy.mockResolvedValue([MOCK_BUILD_EVENT]);
    getDeploymentsSpy.mockResolvedValue([MOCK_DEPLOY_EVENT]);
    getCycleTimeSpy.mockResolvedValue(10);
    getOpenMergeRequestsSpy.mockResolvedValue(10);
  });

  it('successfully returns all available events', async () => {
    const result = await getBackfillData('mock-group-token', MOCK_PROJECT_ID, 'mock-project-name', 'branch', null);

    expect(result).toEqual({
      builds: [MOCK_BUILD_EVENT],
      deployments: [MOCK_DEPLOY_EVENT],
      metrics: {
        mrCycleTime: 10,
        openMergeRequestsCount: 10,
      },
    });

    expect(getBuildsSpy).toHaveBeenCalled();
    expect(getCycleTimeSpy).toHaveBeenCalled();
    expect(getDeploymentsSpy).toHaveBeenCalled();
    expect(getOpenMergeRequestsSpy).toHaveBeenCalled();
  });

  it('should return build events only', async () => {
    const result = await getBackfillData('mock-group-token', MOCK_PROJECT_ID, 'mock-project-name', 'branch', [
      CompassEventType.Build,
    ]);
    expect(result).toEqual({
      builds: [MOCK_BUILD_EVENT],
      deployments: [],
      metrics: {
        mrCycleTime: null,
        openMergeRequestsCount: null,
      },
    });

    expect(getBuildsSpy).toHaveBeenCalled();
    expect(getCycleTimeSpy).not.toHaveBeenCalled();
    expect(getDeploymentsSpy).not.toHaveBeenCalled();
    expect(getOpenMergeRequestsSpy).not.toHaveBeenCalled();
  });

  it('should return deployment events only', async () => {
    const result = await getBackfillData('mock-group-token', MOCK_PROJECT_ID, 'mock-project-name', 'branch', [
      CompassEventType.Deployment,
    ]);
    expect(result).toEqual({
      builds: [],
      deployments: [MOCK_DEPLOY_EVENT],
      metrics: {
        mrCycleTime: null,
        openMergeRequestsCount: null,
      },
    });

    expect(getBuildsSpy).not.toHaveBeenCalled();
    expect(getCycleTimeSpy).not.toHaveBeenCalled();
    expect(getDeploymentsSpy).toHaveBeenCalled();
    expect(getOpenMergeRequestsSpy).not.toHaveBeenCalled();
  });

  it('should return PR metrics events only', async () => {
    const result = await getBackfillData('mock-group-token', MOCK_PROJECT_ID, 'mock-project-name', 'branch', [
      CompassEventType.PullRequest,
    ]);
    expect(result).toEqual({
      builds: [],
      deployments: [],
      metrics: {
        mrCycleTime: 10,
        openMergeRequestsCount: 10,
      },
    });

    expect(getBuildsSpy).not.toHaveBeenCalled();
    expect(getCycleTimeSpy).toHaveBeenCalled();
    expect(getDeploymentsSpy).not.toHaveBeenCalled();
    expect(getOpenMergeRequestsSpy).toHaveBeenCalled();
  });

  test.each(nonBackfillEvents)(
    'should return empty backfill results for %s event types',
    async (eventType: CompassEventType) => {
      const result = await getBackfillData('mock-group-token', MOCK_PROJECT_ID, 'mock-project-name', 'branch', [
        eventType,
      ]);
      expect(result).toEqual({
        builds: [],
        deployments: [],
        metrics: {
          mrCycleTime: null,
          openMergeRequestsCount: null,
        },
      });

      expect(getBuildsSpy).not.toHaveBeenCalled();
      expect(getCycleTimeSpy).not.toHaveBeenCalled();
      expect(getDeploymentsSpy).not.toHaveBeenCalled();
      expect(getOpenMergeRequestsSpy).not.toHaveBeenCalled();
    },
  );
});
