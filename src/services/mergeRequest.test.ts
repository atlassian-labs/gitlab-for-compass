/* eslint-disable import/first, import/order */
import { mocked } from 'jest-mock';

import { mockAgg } from '../__tests__/helpers/mock-agg';

mockAgg();

import { BASE_URL, TEST_TOKEN } from '../__tests__/fixtures/gitlab-data';
import { fetchPaginatedData } from '../utils/fetchPaginatedData';
import { getLastMergedMergeRequests, getOpenMergeRequests } from './mergeRequest';
import { getMergeRequests } from '../client/gitlab';

jest.mock('../utils/fetchPaginatedData');
jest.mock('../client/gitlab');

const mockedFetchPaginatedData = mocked(fetchPaginatedData);
const mockedGetMergeRequests = mocked(getMergeRequests);

const MOCK_PROJECT_ID = 12345;
const BRANCH_NAME = 'koko';

describe('MergeRequest Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws error in case of failed open MR fetching', async () => {
    const errorMsg = 'Error while fetching open merge requests from Gitlab!';
    mockedFetchPaginatedData.mockRejectedValue(new Error(errorMsg));
    await expect(getOpenMergeRequests(BASE_URL, TEST_TOKEN, MOCK_PROJECT_ID, BRANCH_NAME)).rejects.toThrowError(
      errorMsg,
    );
  });

  it('throws error in case of failed merged merge requests fetching', async () => {
    const errorMsg = 'Error while fetching merged merge requests from Gitlab!';

    mockedGetMergeRequests.mockRejectedValue(new Error(errorMsg));
    await expect(getLastMergedMergeRequests(BASE_URL, TEST_TOKEN, MOCK_PROJECT_ID, BRANCH_NAME)).rejects.toThrowError(
      errorMsg,
    );
  });
});
