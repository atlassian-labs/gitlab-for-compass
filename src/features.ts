export enum GitlabFeaturesEnum {
  SEND_STAGING_EVENTS = 'isSendStagingEventsEnabled',
  DATA_COMPONENT_TYPES = 'isDataComponentTypesEnabled',
  DISABLE_DOCUMENT_COMPONENT_LINKS = 'isDocumentComponentLinksDisabled',
}

export type FeaturesList = { [key in GitlabFeaturesEnum]: boolean };
