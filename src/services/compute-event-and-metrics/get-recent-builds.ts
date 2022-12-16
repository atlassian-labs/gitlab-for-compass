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
  try {
    const allPipelines = await fetchPaginatedData(getProjectRecentPipelines, {
      groupToken,
      projectId,
      dateAfter: getDateInThePast(),
      branchName,
    });

    return allPipelines.map((pipeline) => gitlabApiPipelineToCompassDataProviderBuildEvent(pipeline, projectName));
  } catch (err) {
    const DESCRIPTIVE_ERROR_MESSAGE = 'Error while fetching project pipelines from Gitlab.';

    console.error(DESCRIPTIVE_ERROR_MESSAGE, err);
    return [];
  }
};
