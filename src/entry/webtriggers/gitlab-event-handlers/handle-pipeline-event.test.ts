/* eslint-disable import/first, import/order */
import { mocked } from 'jest-mock';

import { mockAgg } from '../../../__tests__/helpers/mock-agg';

mockAgg();

import { generatePipelineEvent } from '../../../__tests__/helpers/gitlab-helper';
import { handlePipelineEvent } from './handle-pipeline-event';
import { getTrackingBranchName } from '../../../services/get-tracking-branch';
import { sendEventToCompass } from '../../../services/send-compass-events';
import { TEST_TOKEN, MOCK_CLOUD_ID } from '../../../__tests__/fixtures/gitlab-data';
import { webhookPipelineEventToCompassBuildEvent } from '../../../services/builds';
import { insertMetricValues } from '../../../services/insert-metric-values';

jest.mock('../../../services/get-tracking-branch');
jest.mock('../../../services/send-compass-events');
jest.mock('../../../client/gitlab');
jest.mock('../../../services/compute-event-and-metrics');
jest.mock('../../../services/insert-metric-values');

describe('Gitlab events', () => {
  const event = generatePipelineEvent();

  const eventWithIncorrectRef = generatePipelineEvent({
    object_attributes: {
      ...generatePipelineEvent().object_attributes,
      ref: 'wrong',
    },
  });
  const getTrackingBranchNameMock = mocked(getTrackingBranchName);
  const sendEventToCompassMock = mocked(sendEventToCompass);
  const insertMetricValuesMock = mocked(insertMetricValues);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ignores event if the branch is not default and non-default branch wasn`t  set', async () => {
    getTrackingBranchNameMock.mockResolvedValue(eventWithIncorrectRef.project.default_branch);

    await handlePipelineEvent(eventWithIncorrectRef, TEST_TOKEN, MOCK_CLOUD_ID);

    expect(sendEventToCompassMock).not.toBeCalled();
    expect(insertMetricValuesMock).not.toBeCalled();
  });

  it('ingests build event for main branch', async () => {
    getTrackingBranchNameMock.mockResolvedValue(event.project.default_branch);

    await handlePipelineEvent(event, TEST_TOKEN, MOCK_CLOUD_ID);

    expect(sendEventToCompassMock).toBeCalledTimes(1);
    expect(sendEventToCompassMock).toBeCalledWith(webhookPipelineEventToCompassBuildEvent(event, MOCK_CLOUD_ID));
    expect(insertMetricValuesMock).not.toBeCalled();
  });

  it('ingests build events from a non-default branch which was set via project variable', async () => {
    const BRANCH_NAME = 'koko';
    getTrackingBranchNameMock.mockResolvedValue(BRANCH_NAME);
    const nonDefaultBranchEvent = generatePipelineEvent({
      object_attributes: {
        ...generatePipelineEvent().object_attributes,
        ref: BRANCH_NAME,
      },
    });

    await handlePipelineEvent(nonDefaultBranchEvent, TEST_TOKEN, MOCK_CLOUD_ID);

    expect(sendEventToCompassMock).toBeCalledTimes(1);
    expect(sendEventToCompassMock).toBeCalledWith(
      webhookPipelineEventToCompassBuildEvent(nonDefaultBranchEvent, MOCK_CLOUD_ID),
    );
    expect(insertMetricValuesMock).not.toBeCalled();
  });
});
