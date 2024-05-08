export enum GitlabFeaturesEnum {
  SEND_STAGING_EVENTS = 'isSendStagingEventsEnabled',
  DATA_COMPONENT_TYPES = 'isDataComponentTypesEnabled',
}

export type FeaturesList = { [key in GitlabFeaturesEnum]: boolean };
