import { FeaturesList, GitlabFeaturesEnum } from '../features';

export const isSendStagingEventsEnabled = (defaultValue = false): boolean => {
  return process.env.FF_SEND_STAGING_EVENTS === 'true' || defaultValue;
};

const isDataComponentTypesEnabled = (defaultValue = false): boolean =>
  process.env.FF_DATA_COMPONENT_TYPES === 'true' || defaultValue;

export const listFeatures = (): FeaturesList => {
  return {
    [GitlabFeaturesEnum.SEND_STAGING_EVENTS]: isSendStagingEventsEnabled(),
    [GitlabFeaturesEnum.DATA_COMPONENT_TYPES]: isDataComponentTypesEnabled(),
  };
};
