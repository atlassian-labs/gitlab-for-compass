export enum GitlabFeaturesEnum {
  SEND_STAGING_EVENTS = 'isSendStagingEventsEnabled',
  CREATE_FROM_YAML = 'isCreateFromYamlEnabled',
}

export type FeaturesList = { [key in GitlabFeaturesEnum]: boolean };
