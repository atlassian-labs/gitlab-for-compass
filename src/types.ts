import { CompassComponentType, CreateLinkInput, CustomFieldFromYAML } from '@atlassian/forge-graphql';

// 2nd parameter passed into extension point & webtrigger functions
type InvocationContext = {
  principal: {
    accountId: string;
  };
  installContext: string;
};

type WebtriggerRequest = {
  body: string;
  queryParameters: {
    groupId: number[];
  };
  headers: {
    [key: string]: string[];
  };
};

type WebtriggerResponse = {
  body: string;
  statusCode: number;
  headers: Record<string, unknown>;
};

type GroupAccessToken = {
  user_id: number;
  scopes: string[];
  name: string;
  expires_at: string;
  id: number;
  active: boolean;
  created_at: string;
  revoked: boolean;
  access_level: number;
};

type BaseGitlabEvent = {
  object_kind: string;
  project: {
    id: number;
    name: string;
    default_branch: string;
    web_url: string;
  };
};

type PushEvent = BaseGitlabEvent & {
  before: string;
  after: string;
  ref: string;
  checkout_sha: string;
  commits: {
    added: string[];
    modified: string[];
    removed: string[];
  };
};

type MergeRequestEvent = BaseGitlabEvent & {
  object_attributes: {
    target_branch: string;
  };
};

type Build = {
  id: number;
  stage: string;
  name: string;
  status: string;
  created_at: string;
  started_at: string;
  finished_at: string | null;
  duration: number;
  queued_duration: number;
  when: string;
  manual: boolean;
  allow_failure: boolean;
  user: any;
  runner: any;
  artifacts_file: any;
  environment: null | {
    name: string;
    action: string;
    deployment_tier: string;
  };
};

type PipelineEvent = BaseGitlabEvent & {
  object_attributes: {
    id: number;
    ref: string;
    tag: boolean;
    sha: string;
    before_sha: string;
    source: string;
    status: string;
    detailed_status: string;
    stages: string[];
    created_at: string;
    finished_at: string | null;
    duration: number;
    queued_duration: any;
    variables: any[];
  };
  builds: Build[];
};

type DeploymentEvent = BaseGitlabEvent & { deployment_id: number; environment: string };

type GitlabEvent = PushEvent | MergeRequestEvent | PipelineEvent | DeploymentEvent;

// Config as code types
type YamlFields = {
  tier?: number;
  lifecycle?: string;
};

type YamlLink = {
  type: string;
  url: string;
  name?: string | null;
  id?: string;
};

type YamlRelationships = {
  DEPENDS_ON?: string[];
};

type CompassYaml = {
  id?: string;
  name?: string;
  description?: string;
  ownerId?: string;
  fields?: YamlFields;
  links?: Array<YamlLink>;
  relationships?: YamlRelationships;
  labels?: Array<string>;
  configVersion?: number;
  typeId?: string;
  customFields?: CustomFieldFromYAML[];
};

type ComponentSyncPayload = {
  componentYaml: CompassYaml;
  absoluteFilePath: string;
};

type ComponentChanges = {
  componentsToSync: ComponentSyncPayload[];
  componentsToUnlink: CompassYaml[];
};

type RegisterWebhookPayload = {
  groupId: number;
  url: string;
  signature: string;
  token: string;
};

type CommitFileDiff = {
  diff: string;
  old_path: string;
  new_path: string;
  new_file: boolean;
  renamed_file: boolean;
  deleted_file: boolean;
};

type DiffsByChangeType = {
  added: CommitFileDiff[];
  modified: CommitFileDiff[];
  removed: CommitFileDiff[];
};

enum Queues {
  IMPORT = 'import-queue',
}

enum COMPASS_GATEWAY_MESSAGES {
  COMPONENT_NOT_FOUND = 'Component not found',
}

type GitlabAPIGroup = {
  full_name: string;
  name: string;
  id: number;
  path: string;
};

type GitlabAPIProject = {
  id: number;
  description: string;
  name: string;
  topics: string[];
  default_branch: string;
  web_url: string;
  namespace: {
    id: number;
    full_path: string;
    name: string;
    path: string;
  };
  created_at: string;
};

type Project = {
  id: number;
  description: string | null;
  name: string;
  url: string;
  labels: string[];
  defaultBranch: string;
  groupName: string;
  groupPath: string;
  groupFullPath: string;
};

type ProjectImportStatus = {
  isManaged: boolean;
  isCompassFilePrOpened: boolean;
  hasComponent: boolean;
};

type ProjectReadyForImport = {
  componentId?: string;
  componentLinks?: CreateLinkInput[];
  componentType?: CompassComponentType;
  shouldOpenMR?: boolean;
} & ProjectImportStatus &
  Project;

type ImportableProject = ProjectReadyForImport & {
  type: CompassComponentType;
};

type ProjectImportResult = {
  failed: ImportableProject[];
  total: number;
};

type ImportStatus = {
  success: number;
  inProgress: number;
  failed: number;
};

type ProjectBranch = {
  name: string;
};

type Deployment = {
  id: number;
  created_at: string;
  updated_at: string;
  deployable: {
    status: string;
    finished_at: string;
    pipeline: {
      id: number;
      web_url: string;
    };
  };
  environment: {
    name: string;
    id: number;
  };
  status: string;
};

type GitlabApiPipeline = {
  id: number;
  project_id: number;
  status: string;
  ref: string;
  web_url: string;
  created_at: string;
  updated_at: string;
};

type Metric = {
  metricAri: string;
  value: number;
  timestamp?: string;
};

type MetricsEventPayload = {
  projectID: string;
  metrics: Metric[];
};

type MergeRequest = {
  merged_at: string;
  created_at: string;
};

enum MergeRequestState {
  OPENED = 'opened',
  CLOSED = 'closed',
  LOCKED = 'locked',
  MERGED = 'merged',
}

enum MergeRequestOrderBy {
  UPDATED_AT = 'updated_at',
  CREATED_AT = 'created_at',
  TITLE = 'title',
}

enum EnvironmentTier {
  PRODUCTION = 'production',
  STAGING = 'staging',
  TESTING = 'testing',
  DEVELOPMENT = 'development',
  OTHER = 'other',
}

enum GitlabPipelineStates {
  CREATED = 'created',
  WAITING_FOR_RESOURCE = 'waiting_for_resource',
  PREPARING = 'preparing',
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELED = 'canceled',
  SKIPPED = 'skipped',
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
}

enum GitLabAccessLevels {
  NO_ACCESS = 0,
  MINIMAL_ACCESS = 5,
  GUEST = 10,
  REPORTER = 20,
  DEVELOPER = 30,
  MAINTAINER = 40,
  OWNER = 50,
}

type Environment = {
  id: number;
  name: string;
  tier: EnvironmentTier;
};

type GroupProjectsResponse = {
  total: number;
  projects: ProjectReadyForImport[];
};

type ComponentTierField = Array<string | null> | undefined;

type ComponentLifecycleField = Array<string | null> | undefined;

export type {
  WebtriggerRequest,
  WebtriggerResponse,
  GitlabAPIGroup,
  GroupAccessToken,
  GitlabEvent,
  PushEvent,
  MergeRequestEvent,
  PipelineEvent,
  DeploymentEvent,
  ComponentChanges,
  RegisterWebhookPayload,
  CommitFileDiff,
  CompassYaml,
  ComponentSyncPayload,
  YamlLink,
  YamlRelationships,
  YamlFields,
  DiffsByChangeType,
  GitlabAPIProject,
  GitlabApiPipeline,
  Project,
  ProjectReadyForImport,
  ImportableProject,
  ProjectImportResult,
  ImportStatus,
  InvocationContext,
  ProjectBranch,
  Deployment,
  MetricsEventPayload,
  MergeRequest,
  Metric,
  Environment,
  GroupProjectsResponse,
  ComponentTierField,
  ComponentLifecycleField,
};

export {
  Queues,
  COMPASS_GATEWAY_MESSAGES,
  MergeRequestState,
  MergeRequestOrderBy,
  EnvironmentTier,
  GitlabPipelineStates,
  GitLabAccessLevels,
};
