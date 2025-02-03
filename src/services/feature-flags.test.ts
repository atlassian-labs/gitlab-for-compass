import { listFeatures } from './feature-flags';

describe('listFeatures', () => {
  beforeEach(() => {
    process.env.FF_SEND_STAGING_EVENTS = 'false';
  });

  it('gets feature flags from their variables', async () => {
    process.env.FF_SEND_STAGING_EVENTS = 'true';

    const featureFlags = listFeatures();

    expect(featureFlags.isSendStagingEventsEnabled).toEqual(true);
  });

  it('gets feature flags in their default state', async () => {
    const featureFlags = listFeatures();

    expect(featureFlags.isSendStagingEventsEnabled).toEqual(false);
  });
});
