import { fetchPaginatedData } from '../utils/fetchPaginatedData';
import { getMergeRequests, MergeRequestWorkInProgressFilterOptions } from '../client/gitlab';
import { MergeRequest, MergeRequestOrderBy, MergeRequestState } from '../types';

export const getOpenMergeRequests = async (
  groupToken: string,
  projectId: number,
  targetBranch: string,
): Promise<MergeRequest[]> => {
  const scope = 'all';

  try {
    return fetchPaginatedData(getMergeRequests, {
      groupToken,
      projectId,
      state: MergeRequestState.OPENED,
      scope,
      targetBranch,
      orderBy: MergeRequestOrderBy.UPDATED_AT,
      wip: MergeRequestWorkInProgressFilterOptions.FILTER_OUT_WIP,
      isSimpleView: true,
    });
  } catch (err) {
    const ERROR_MESSAGE = 'Error while fetching open merge requests from Gitlab!';
    console.error(ERROR_MESSAGE, err);

    throw new Error(ERROR_MESSAGE);
  }
};

export const getLastMergedMergeRequests = async (
  groupToken: string,
  projectId: number,
  targetBranch: string,
  numberOfMergeRequests = 10,
): Promise<MergeRequest[]> => {
  const page = 1;
  const scope = 'all';

  try {
    const { data } = await getMergeRequests(page, numberOfMergeRequests, {
      groupToken,
      projectId,
      state: MergeRequestState.MERGED,
      scope,
      targetBranch,
      orderBy: MergeRequestOrderBy.UPDATED_AT,
    });

    return data;
  } catch (e) {
    const ERROR_MESSAGE = 'Error while fetching merged merge requests from Gitlab!';

    console.error(ERROR_MESSAGE, e.message);

    throw new Error(ERROR_MESSAGE);
  }
};
