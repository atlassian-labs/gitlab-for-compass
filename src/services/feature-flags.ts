import { FeaturesList, GitlabFeaturesEnum } from '../features';

export const isSendStagingEventsEnabled = (defaultValue = false): boolean => {
  return process.env.FF_SEND_STAGING_EVENTS === 'true' || defaultValue;
};

export const isOwnerTeamEnabled = (defaultValue = false): boolean => {
  return process.env.OWNER_TEAM_FF === 'true' || defaultValue;
};

export const listFeatures = (): FeaturesList => {
  return {
    [GitlabFeaturesEnum.SEND_STAGING_EVENTS]: isSendStagingEventsEnabled(),
    [GitlabFeaturesEnum.OWNER_TEAM]: isOwnerTeamEnabled(),
  };
};
