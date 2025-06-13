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

export const isCompassPushEventEnabled = (defaultValue = false): boolean => {
  return process.env.COMPASS_PUSH_EVENTS === 'true' || defaultValue;
};

export const isPackageDependenciesM3Enabled = (defaultValue = false): boolean => {
  return process.env.FF_PACKAGE_DEPENDENCIES_M3 === 'true' || defaultValue;
};

const isImportAllEnabled = (defaultValue = false): boolean => {
  return process.env.FF_IMPORT_ALL_ENABLED === 'true' || defaultValue;
};

const isResyncConfigAsCodeEnabled = (defaultValue = false): boolean => {
  return process.env.FF_RESYNC_CAC_ENABLED === 'true' || defaultValue;
};

export const listFeatures = (): FeaturesList => {
  return {
    [GitlabFeaturesEnum.SEND_STAGING_EVENTS]: isSendStagingEventsEnabled(),
    [GitlabFeaturesEnum.DATA_COMPONENT_TYPES]: isDataComponentTypesEnabled(),
    [GitlabFeaturesEnum.DISABLE_DOCUMENT_COMPONENT_LINKS]: isDocumentComponentLinksDisabled(),
    [GitlabFeaturesEnum.ENABLE_GITLAB_MAINTAINER_TOKEN]: isGitlabMaintainerTokenEnabled(),
    [GitlabFeaturesEnum.IMPORT_ALL]: isImportAllEnabled(),
    [GitlabFeaturesEnum.COMPASS_PUSH_EVENTS]: isCompassPushEventEnabled(),
    [GitlabFeaturesEnum.PACKAGE_DEPENDENCIES_M3]: isPackageDependenciesM3Enabled(),
    [GitlabFeaturesEnum.RESYNC_CAC]: isResyncConfigAsCodeEnabled(),
  };
};
