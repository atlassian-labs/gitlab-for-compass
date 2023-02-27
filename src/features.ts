export enum GitlabFeaturesEnum {
  SEND_STAGING_EVENTS = 'isSendStagingEventsEnabled',
}

export type FeaturesList = { [key in GitlabFeaturesEnum]: boolean };
