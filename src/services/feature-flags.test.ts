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

  it('uses cloudId to determine if gitlab maintainer token is enabled', async () => {
    process.env.ENABLE_GITLAB_MAINTAINER_TOKEN_CLOUD_IDS = 'cloudId1,cloudId2';
    process.env.ENABLE_GITLAB_MAINTAINER_TOKEN = 'true';

    let featureFlags = listFeatures('cloudId1');
    expect(featureFlags.isGitlabMaintainerTokenEnabled).toEqual(true);

    featureFlags = listFeatures();
    expect(featureFlags.isGitlabMaintainerTokenEnabled).toEqual(true);

    featureFlags = listFeatures('cloudId3');
    expect(featureFlags.isGitlabMaintainerTokenEnabled).toEqual(false);

    process.env.ENABLE_GITLAB_MAINTAINER_TOKEN_CLOUD_IDS = '';

    featureFlags = listFeatures('cloudId1');
    expect(featureFlags.isGitlabMaintainerTokenEnabled).toEqual(true);
  });
});
