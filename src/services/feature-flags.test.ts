import { listFeatures } from './feature-flags';

describe('listFeatures', () => {
  beforeEach(() => {
    process.env.FF_SEND_STAGING_EVENTS = 'false';
    process.env.COMPASS_PUSH_EVENTS = 'false';
  });

  it('gets feature flags from their variables', async () => {
    process.env.FF_SEND_STAGING_EVENTS = 'true';
    process.env.COMPASS_PUSH_EVENTS = 'true';

    const featureFlags = listFeatures();

    expect(featureFlags.isSendStagingEventsEnabled).toEqual(true);
    expect(featureFlags.isCompassPushEventEnabled).toEqual(true);
  });

  it('gets feature flags in their default state', async () => {
    const featureFlags = listFeatures();

    expect(featureFlags.isSendStagingEventsEnabled).toEqual(false);
    expect(featureFlags.isCompassPushEventEnabled).toEqual(false);
  });
});
