/* eslint-disable import/first */
import { mocked } from 'jest-mock';
import { mockForgeApi } from '../__tests__/helpers/forge-helper';

mockForgeApi();

import { getProjectVariable, getProjectBranch } from '../client/gitlab';
import { getTrackingBranchName } from './get-tracking-branch';
import { BASE_URL } from '../__tests__/fixtures/gitlab-data';

jest.mock('../client/gitlab');

const mockGetProjectVariable = mocked(getProjectVariable);
const mockGetProjectBranch = mocked(getProjectBranch);

const MOCK_NON_DEFAULT_BRANCH_NAME = 'non-default-branch';
const MOCK_DEFAULT_BRANCH_NAME = 'main';

describe('getTrackingBranchName', () => {
  it('returns non-default branch name if the variable and branch exist in Gitlab', async () => {
    mockGetProjectVariable.mockResolvedValue(MOCK_NON_DEFAULT_BRANCH_NAME);
    mockGetProjectBranch.mockResolvedValue({ name: MOCK_NON_DEFAULT_BRANCH_NAME });

    expect(await getTrackingBranchName(BASE_URL, 'groupToken', 1234, MOCK_DEFAULT_BRANCH_NAME)).toBe(
      MOCK_NON_DEFAULT_BRANCH_NAME,
    );
  });

  it('returns default branch name if non-default branch does not exist', async () => {
    mockGetProjectVariable.mockResolvedValue(MOCK_NON_DEFAULT_BRANCH_NAME);
    mockGetProjectBranch.mockRejectedValue('404 Branch Not Found');

    expect(await getTrackingBranchName(BASE_URL, 'groupToken', 1234, MOCK_DEFAULT_BRANCH_NAME)).toEqual(
      MOCK_DEFAULT_BRANCH_NAME,
    );
  });
});
