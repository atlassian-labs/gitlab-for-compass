import { FeaturesList, GitlabFeaturesEnum } from '../features';

export const isSendStagingEventsEnabled = (defaultValue = false): boolean => {
  return process.env.FF_SEND_STAGING_EVENTS === 'true' || defaultValue;
};

const isDataComponentTypesEnabled = (defaultValue = false): boolean =>
  process.env.FF_DATA_COMPONENT_TYPES === 'true' || defaultValue;

const isDocumentComponentLinksDisabled = (defaultValue = false): boolean => {
  return process.env.DISABLE_DOCUMENT_COMPONENT_LINKS === 'true' || defaultValue;
};

export const isGitlabMaintainerTokenEnabled = (cloudId?: string, defaultValue = false): boolean => {
  // cloudId is available in frontend context when fetching features for AppContext.
  // It is not available in all backend contexts, so we will use the default value if it is not provided.
  const isEnabledForCloudId =
    !!cloudId && !!process.env.ENABLE_GITLAB_MAINTAINER_TOKEN_CLOUD_IDS
      ? process.env.ENABLE_GITLAB_MAINTAINER_TOKEN_CLOUD_IDS.split(',').includes(cloudId)
      : true;

  return (process.env.ENABLE_GITLAB_MAINTAINER_TOKEN === 'true' && isEnabledForCloudId) || defaultValue;
};

const isImportAllEnabled = (defaultValue = false): boolean => {
  return process.env.FF_IMPORT_ALL_ENABLED === 'true' || defaultValue;
};

export const listFeatures = (cloudId?: string): FeaturesList => {
  return {
    [GitlabFeaturesEnum.SEND_STAGING_EVENTS]: isSendStagingEventsEnabled(),
    [GitlabFeaturesEnum.DATA_COMPONENT_TYPES]: isDataComponentTypesEnabled(),
    [GitlabFeaturesEnum.DISABLE_DOCUMENT_COMPONENT_LINKS]: isDocumentComponentLinksDisabled(),
    [GitlabFeaturesEnum.ENABLE_GITLAB_MAINTAINER_TOKEN]: isGitlabMaintainerTokenEnabled(cloudId),
    [GitlabFeaturesEnum.IMPORT_ALL]: isImportAllEnabled(),
  };
};
