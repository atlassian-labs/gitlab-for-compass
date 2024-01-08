export enum GitlabFeaturesEnum {
  SEND_STAGING_EVENTS = 'isSendStagingEventsEnabled',
  OWNER_TEAM = 'isOwnerTeamEnabled',
}

export type FeaturesList = { [key in GitlabFeaturesEnum]: boolean };
