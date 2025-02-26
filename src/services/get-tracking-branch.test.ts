/* eslint-disable import/first */
import { mocked } from 'jest-mock';
import { mockForgeApi } from '../__tests__/helpers/forge-helper';

mockForgeApi();

import { getProjectVariable, getProjectBranch } from '../client/gitlab';
import { getTrackingBranchName, getProjectTrackingBranch } from './get-tracking-branch';

jest.mock('../client/gitlab');

const mockGetProjectVariable = mocked(getProjectVariable);
const mockGetProjectBranch = mocked(getProjectBranch);

const MOCK_NON_DEFAULT_BRANCH_NAME = 'non-default-branch';
const MOCK_DEFAULT_BRANCH_NAME = 'main';
const MOCK_COMMIT_SHA = 'e5a4d979f18d89e921f9f4227ac33422d9745695';

describe('getTrackingBranchName', () => {
  it('returns non-default branch name if the variable and branch exist in Gitlab', async () => {
    mockGetProjectVariable.mockResolvedValue(MOCK_NON_DEFAULT_BRANCH_NAME);
    mockGetProjectBranch.mockResolvedValue({ name: MOCK_NON_DEFAULT_BRANCH_NAME, commit: { id: MOCK_COMMIT_SHA } });

    expect(await getTrackingBranchName('groupToken', 1234, MOCK_DEFAULT_BRANCH_NAME)).toBe(
      MOCK_NON_DEFAULT_BRANCH_NAME,
    );
  });

  it('returns default branch name if non-default branch does not exist', async () => {
    mockGetProjectVariable.mockResolvedValue(MOCK_NON_DEFAULT_BRANCH_NAME);
    mockGetProjectBranch.mockRejectedValue('404 Branch Not Found');

    expect(await getTrackingBranchName('groupToken', 1234, MOCK_DEFAULT_BRANCH_NAME)).toEqual(MOCK_DEFAULT_BRANCH_NAME);
  });
});

describe('getProjectTrackingBranch', () => {
  it('returns the non-default branch if the variable and branch exist in Gitlab', async () => {
    mockGetProjectVariable.mockResolvedValue(MOCK_NON_DEFAULT_BRANCH_NAME);
    mockGetProjectBranch.mockResolvedValue({ name: MOCK_NON_DEFAULT_BRANCH_NAME, commit: { id: MOCK_COMMIT_SHA } });

    const result = await getProjectTrackingBranch('groupToken', 1234, MOCK_DEFAULT_BRANCH_NAME);
    expect(result).toEqual({ name: MOCK_NON_DEFAULT_BRANCH_NAME, commit: { id: MOCK_COMMIT_SHA } });
  });

  it('returns the default branch if the variable does not exist', async () => {
    mockGetProjectVariable.mockRejectedValue('404 Variable Not Found');
    mockGetProjectBranch.mockResolvedValue({ name: MOCK_DEFAULT_BRANCH_NAME, commit: { id: MOCK_COMMIT_SHA } });

    const result = await getProjectTrackingBranch('groupToken', 1234, MOCK_DEFAULT_BRANCH_NAME);
    expect(result).toEqual({ name: MOCK_DEFAULT_BRANCH_NAME, commit: { id: MOCK_COMMIT_SHA } });
  });

  it('returns null if the branch does not exist in Gitlab', async () => {
    mockGetProjectVariable.mockResolvedValue(MOCK_NON_DEFAULT_BRANCH_NAME);
    mockGetProjectBranch.mockRejectedValue(new Error('404 branch not Found'));

    const result = await getProjectTrackingBranch('groupToken', 1234, MOCK_DEFAULT_BRANCH_NAME);
    expect(result).toBeNull();
  });
});
