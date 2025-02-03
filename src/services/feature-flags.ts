import { FeaturesList, GitlabFeaturesEnum } from '../features';

export const isSendStagingEventsEnabled = (defaultValue = false): boolean => {
  return process.env.FF_SEND_STAGING_EVENTS === 'true' || defaultValue;
};

const isDataComponentTypesEnabled = (defaultValue = false): boolean =>
  process.env.FF_DATA_COMPONENT_TYPES === 'true' || defaultValue;

const isDocumentComponentLinksDisabled = (defaultValue = false): boolean => {
  return process.env.DISABLE_DOCUMENT_COMPONENT_LINKS === 'true' || defaultValue;
};

export const isGitlabMaintainerTokenEnabled = (defaultValue = false): boolean => {
  return process.env.ENABLE_GITLAB_MAINTAINER_TOKEN === 'true' || defaultValue;
};

const isImportAllEnabled = (defaultValue = false): boolean => {
  return process.env.FF_IMPORT_ALL_ENABLED === 'true' || defaultValue;
};

export const listFeatures = (): FeaturesList => {
  return {
    [GitlabFeaturesEnum.SEND_STAGING_EVENTS]: isSendStagingEventsEnabled(),
    [GitlabFeaturesEnum.DATA_COMPONENT_TYPES]: isDataComponentTypesEnabled(),
    [GitlabFeaturesEnum.DISABLE_DOCUMENT_COMPONENT_LINKS]: isDocumentComponentLinksDisabled(),
    [GitlabFeaturesEnum.ENABLE_GITLAB_MAINTAINER_TOKEN]: isGitlabMaintainerTokenEnabled(),
    [GitlabFeaturesEnum.IMPORT_ALL]: isImportAllEnabled(),
  };
};
