/*
  TO EDIT THIS FILE, you must edit the file in the repo's src directory and running yarn ui:build or yarn ui:prebuild will generate the types in the ui/src directory.

  This file contains types that are used in both of the directories and need to stay in sync. So, the ui/src types are gitignored
 */

export enum GitlabFeaturesEnum {
  SEND_STAGING_EVENTS = 'isSendStagingEventsEnabled',
  DATA_COMPONENT_TYPES = 'isDataComponentTypesEnabled',
  DISABLE_DOCUMENT_COMPONENT_LINKS = 'isDocumentComponentLinksDisabled',
  ENABLE_GITLAB_MAINTAINER_TOKEN = 'isGitlabMaintainerTokenEnabled',
  IMPORT_ALL = 'isImportAllEnabled',
  COMPASS_PUSH_EVENTS = 'isCompassPushEventEnabled',
  PACKAGE_DEPENDENCIES_M3 = 'isPackageDependenciesM3Enabled',
}

export type FeaturesList = { [key in GitlabFeaturesEnum]: boolean };
