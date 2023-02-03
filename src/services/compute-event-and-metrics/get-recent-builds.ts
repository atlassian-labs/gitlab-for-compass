import { DataProviderBuildEvent } from '@atlassian/forge-graphql';
import { getProjectRecentPipelines } from '../../client/gitlab';
import { gitlabApiPipelineToCompassDataProviderBuildEvent } from '../builds';
import { getDateInThePast } from '../../utils/time-utils';
import { fetchPaginatedData } from '../../utils/fetchPaginatedData';

export const getProjectBuildsFor28Days = async (
  groupToken: string,
  projectId: number,
  projectName: string,
  branchName: string,
): Promise<DataProviderBuildEvent[]> => {
  const allPipelines = await fetchPaginatedData(getProjectRecentPipelines, {
    groupToken,
    projectId,
    dateAfter: getDateInThePast(),
    branchName,
  });

  return allPipelines.map((pipeline) => gitlabApiPipelineToCompassDataProviderBuildEvent(pipeline, projectName));
};
