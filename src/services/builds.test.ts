/* eslint-disable import/first */
/* eslint-disable import/order */
import { mockForgeApi } from '../__tests__/helpers/forge-helper';

mockForgeApi();

import { CompassBuildEventState } from '@atlassian/forge-graphql';
import { pipelineLastUpdated, toCompassBuildState } from './builds';
import { latestDate, pipelineWebhookFixture } from '../__tests__/fixtures/build-webhook-payload';

describe('toCompassBuildState method', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('correctly gitlab build state to compass build state', async () => {
    // inprogress
    expect(toCompassBuildState('created')).toEqual(CompassBuildEventState.InProgress);
    expect(toCompassBuildState('waiting_for_resource')).toEqual(CompassBuildEventState.InProgress);
    expect(toCompassBuildState('preparing')).toEqual(CompassBuildEventState.InProgress);
    expect(toCompassBuildState('pending')).toEqual(CompassBuildEventState.InProgress);
    expect(toCompassBuildState('running')).toEqual(CompassBuildEventState.InProgress);
    expect(toCompassBuildState('manual')).toEqual(CompassBuildEventState.InProgress);
    // successful
    expect(toCompassBuildState('success')).toEqual(CompassBuildEventState.Successful);
    // cancelled
    expect(toCompassBuildState('canceled')).toEqual(CompassBuildEventState.Cancelled);
    // unknown
    expect(toCompassBuildState('scheduled')).toEqual(CompassBuildEventState.Unknown);
    // unknown as default
    expect(toCompassBuildState('some_unknown_status_koko')).toEqual(CompassBuildEventState.Unknown);
  });
});

describe('pipelineLastUpdated method', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns correct latest time based on pipeline event top-level finished_time', async () => {
    expect(pipelineWebhookFixture.object_attributes.finished_at).not.toEqual(null);
    expect(pipelineLastUpdated(pipelineWebhookFixture)).toEqual(
      new Date(pipelineWebhookFixture.object_attributes.finished_at),
    );
  });

  it('returns correct latest time based on pipeline event builds time', async () => {
    const pipelineEventCopy = JSON.parse(JSON.stringify(pipelineWebhookFixture));
    pipelineEventCopy.object_attributes.finished_at = null;

    expect(pipelineEventCopy.object_attributes.finished_at).toEqual(null);
    expect(pipelineLastUpdated(pipelineEventCopy)).toEqual(new Date(latestDate));
  });
});
