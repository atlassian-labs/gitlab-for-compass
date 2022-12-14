/* eslint-disable import/first, import/order */

import { mocked } from 'jest-mock';
import { mockForgeApi } from '../../../__tests__/helpers/forge-helper';

mockForgeApi();

import { BuiltinMetricDefinitions } from '@atlassian/forge-graphql';
import { insertMetricValues } from '../../../services/insert-metric-values';
import { getLastMergedMergeRequests, getOpenMergeRequests } from '../../../services/mergeRequest';
import { getTrackingBranchName } from '../../../services/get-tracking-branch';
import { mergeRequests, MOCK_CLOUD_ID, TEST_TOKEN } from '../../../__tests__/fixtures/gitlab-data';
import { handleMergeRequestEvent } from './handle-merge-request-event';
import {
  generateMergeRequestEvent,
  generateMetric,
  generateMetricInput,
} from '../../../__tests__/helpers/gitlab-helper';

jest.mock('../../../services/get-tracking-branch');
jest.mock('../../../services/mergeRequest', () => ({
  getLastMergedMergeRequests: jest.fn(),
  getOpenMergeRequests: jest.fn(),
}));
jest.mock('../../../services/insert-metric-values');

const mockedGetTrackingBranchName = mocked(getTrackingBranchName);
const mockedGetLastMergedMergeRequests = mocked(getLastMergedMergeRequests);
const mockedGetOpenMergeRequests = mocked(getOpenMergeRequests);
const mockedInsertMetricValues = mocked(insertMetricValues);

const MOCK_MERGE_REQUEST_EVENT = generateMergeRequestEvent();
const MOCK_METRIC_INPUT = generateMetricInput([
  generateMetric(BuiltinMetricDefinitions.PULL_REQUEST_CYCLE_TIME_AVG_LAST_10),
  generateMetric(BuiltinMetricDefinitions.OPEN_PULL_REQUESTS, 2),
]);

describe('Gitlab merge request', () => {
  it('handles merge request event', async () => {
    mockedGetTrackingBranchName.mockResolvedValue(MOCK_MERGE_REQUEST_EVENT.project.default_branch);
    mockedGetLastMergedMergeRequests.mockResolvedValue(mergeRequests);
    mockedGetOpenMergeRequests.mockResolvedValue(mergeRequests);

    await handleMergeRequestEvent(MOCK_MERGE_REQUEST_EVENT, TEST_TOKEN, MOCK_CLOUD_ID);

    expect(mockedInsertMetricValues).toHaveBeenCalledWith(MOCK_METRIC_INPUT, MOCK_CLOUD_ID);
  });
});
