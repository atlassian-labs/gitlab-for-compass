import {
  CompassBuildEventState,
  CompassComponentType,
  Component,
  ComponentPayload,
  DataProviderBuildEvent,
  Link,
} from '@atlassian/forge-graphql';
import { pipelineWebhookFixture } from '../fixtures/build-webhook-payload';
import {
  CommitFileDiff,
  DeploymentEvent,
  Environment,
  EnvironmentTier,
  GitlabAPIProject,
  MergeRequestEvent,
  Metric,
  PipelineEvent,
  ProjectReadyForImport,
  PushEvent,
} from '../../types';
import { TEST_COMPONENT_ID } from '../fixtures/gitlab-data';

export const generatePushEvent = (overrideEvent: Partial<PushEvent> = {}): PushEvent => {
  return {
    object_kind: 'push',
    before: 'before',
    after: 'after',
    ref: 'refs/heads/main',
    checkout_sha: 'checkout_sha',
    project: {
      id: 1,
      name: 'test',
      default_branch: 'main',
      web_url: 'https://test',
    },
    commits: {
      added: [],
      modified: [],
      removed: [],
    },
    ...overrideEvent,
  };
};

export const generatePipelineEvent = (overrideEvent: Partial<PipelineEvent> = {}): PipelineEvent => {
  return {
    ...pipelineWebhookFixture,
    ...overrideEvent,
  };
};

export const generateMergeRequestEvent = (overrideEvent: Partial<MergeRequestEvent> = {}): MergeRequestEvent => {
  return {
    object_kind: 'merge_request',
    project: {
      id: 1,
      name: 'test',
      default_branch: 'main',
      web_url: 'https://test',
    },
    object_attributes: {
      target_branch: 'main',
    },
    ...overrideEvent,
  };
};

export const generateDeploymentEvent = (overrideEvent: Partial<DeploymentEvent> = {}): DeploymentEvent => {
  return {
    object_kind: 'deployment',
    deployment_id: 1,
    project: {
      id: 1,
      name: 'test',
      default_branch: 'main',
      web_url: 'https://test',
    },
    environment: 'production',
    ...overrideEvent,
  };
};

export const generateEnvironmentEvent = (tier: Partial<EnvironmentTier> = EnvironmentTier.PRODUCTION): Environment => ({
  id: 1,
  name: 'production',
  tier,
});

export const generateMetric = (metricAri: string, value = 13): Metric => ({
  metricAri,
  value,
  timestamp: expect.anything(),
});

export const generateMetricInput = (metrics: Metric[], projectID = '1') => ({
  projectID,
  metrics,
});
export const createCommitFileDiff = (overrideCommitFileDiff: Partial<CommitFileDiff> = {}): CommitFileDiff => ({
  diff: 'diff',
  new_path: 'new/path',
  old_path: 'old/path',
  new_file: false,
  renamed_file: false,
  deleted_file: false,
  ...overrideCommitFileDiff,
});

export const generateComponent = (overrideComponent: Partial<Component> = {}): ComponentPayload => {
  return {
    component: {
      id: TEST_COMPONENT_ID,
      name: 'koko',
      type: CompassComponentType.Service,
      typeId: 'service',
      changeMetadata: {},
      ...overrideComponent,
    },
  };
};

export const generateProjectsWithStatuses = (
  hasComponent: boolean,
  isManaged: boolean,
  override: Partial<ProjectReadyForImport> = {},
) => [
  {
    id: 1,
    name: 'koko',
    description: 'description',
    defaultBranch: 'default_branch',
    labels: ['label', 'language:javascript'],
    url: 'web_url',
    componentId: TEST_COMPONENT_ID,
    componentLinks: [] as unknown as Link[],
    componentType: CompassComponentType.Service,
    hasComponent,
    isCompassFilePrOpened: false,
    isManaged,
    groupFullPath: 'path/group/koko',
    groupName: 'group/koko',
    groupPath: 'group/koko',
    ...override,
  },
];

export const generateGitlabProject = (override: Partial<GitlabAPIProject> = {}): GitlabAPIProject => ({
  id: 1,
  description: 'description',
  name: 'name',
  topics: ['topic'],
  default_branch: 'main',
  web_url: 'web_url',
  namespace: {
    id: 1,
    full_path: 'full_path',
    name: 'name',
    path: 'path',
  },
  created_at: expect.anything(),
  ...override,
});

export const builds = [
  {
    description: 'Pipeline run 571288088 for project subgroup-project',
    displayName: 'subgroup-project pipeline 571288088',
    state: CompassBuildEventState.Successful,
    startedAt: '2022-06-23T12:55:47.054Z',
    lastUpdated: '2022-06-23T12:57:29.654Z',
    updateSequenceNumber: 1655989049654,
    url: '',
  },
  {
    description: 'Pipeline run 571274787 for project subgroup-project',
    displayName: 'subgroup-project pipeline 571274787',
    state: CompassBuildEventState.Successful,
    startedAt: '2022-06-23T12:42:12.898Z',
    lastUpdated: '2022-06-23T12:43:13.773Z',
    updateSequenceNumber: 1655988193773,
    url: '',
  },
  {
    description: 'Pipeline run 571269170 for project subgroup-project',
    displayName: 'subgroup-project pipeline 571269170',
    state: CompassBuildEventState.Successful,
    startedAt: '2022-06-23T12:36:29.405Z',
    lastUpdated: '2022-06-23T12:37:32.957Z',
    updateSequenceNumber: 1655987852957,
    url: '',
  },
] as unknown as DataProviderBuildEvent[];

export const unsortedProjects = [
  {
    id: 1,
    name: 'b',
    description: 'description',
    defaultBranch: 'default_branch',
    labels: ['label', 'language:javascript'],
    url: 'web_url',
    componentId: '',
    componentLinks: [] as unknown as Link[],
    componentType: CompassComponentType.Application,
    hasComponent: true,
    isCompassFilePrOpened: false,
    isManaged: true,
    groupFullPath: 'koko',
    groupName: 'koko',
    groupPath: 'koko',
  },
  {
    id: 2,
    name: 'a',
    description: 'description',
    defaultBranch: 'default_branch',
    labels: ['label', 'language:javascript'],
    url: 'web_url',
    componentId: '',
    componentLinks: [] as unknown as Link[],
    componentType: CompassComponentType.Application,
    hasComponent: true,
    isCompassFilePrOpened: false,
    isManaged: true,
    groupFullPath: 'koko',
    groupName: 'koko',
    groupPath: 'koko',
  },
  {
    id: 3,
    name: 'b',
    description: 'description',
    defaultBranch: 'default_branch',
    labels: ['label', 'language:javascript'],
    url: 'web_url',
    componentId: '',
    componentLinks: [] as unknown as Link[],
    componentType: CompassComponentType.Application,
    hasComponent: true,
    isCompassFilePrOpened: false,
    isManaged: true,
    groupFullPath: 'momo',
    groupName: 'momo',
    groupPath: 'momo',
  },
  {
    id: 4,
    name: 'a',
    description: 'description',
    defaultBranch: 'default_branch',
    labels: ['label', 'language:javascript'],
    url: 'web_url',
    componentId: '',
    componentLinks: [] as unknown as Link[],
    componentType: CompassComponentType.Application,
    hasComponent: true,
    isCompassFilePrOpened: false,
    isManaged: true,
    groupFullPath: 'momo',
    groupName: 'momo',
    groupPath: 'momo',
  },
];

export const sortedProjects = [
  {
    id: 2,
    name: 'a',
    description: 'description',
    defaultBranch: 'default_branch',
    labels: ['label', 'language:javascript'],
    url: 'web_url',
    componentId: '',
    componentLinks: [] as unknown as Link[],
    componentType: CompassComponentType.Application,
    hasComponent: true,
    isCompassFilePrOpened: false,
    isManaged: true,
    groupFullPath: 'koko',
    groupName: 'koko',
    groupPath: 'koko',
  },
  {
    id: 1,
    name: 'b',
    description: 'description',
    defaultBranch: 'default_branch',
    labels: ['label', 'language:javascript'],
    url: 'web_url',
    componentId: '',
    componentLinks: [] as unknown as Link[],
    componentType: CompassComponentType.Application,
    hasComponent: true,
    isCompassFilePrOpened: false,
    isManaged: true,
    groupFullPath: 'koko',
    groupName: 'koko',
    groupPath: 'koko',
  },
  {
    id: 4,
    name: 'a',
    description: 'description',
    defaultBranch: 'default_branch',
    labels: ['label', 'language:javascript'],
    url: 'web_url',
    componentId: '',
    componentLinks: [] as unknown as Link[],
    componentType: CompassComponentType.Application,
    hasComponent: true,
    isCompassFilePrOpened: false,
    isManaged: true,
    groupFullPath: 'momo',
    groupName: 'momo',
    groupPath: 'momo',
  },
  {
    id: 3,
    name: 'b',
    description: 'description',
    defaultBranch: 'default_branch',
    labels: ['label', 'language:javascript'],
    url: 'web_url',
    componentId: '',
    componentLinks: [] as unknown as Link[],
    componentType: CompassComponentType.Application,
    hasComponent: true,
    isCompassFilePrOpened: false,
    isManaged: true,
    groupFullPath: 'momo',
    groupName: 'momo',
    groupPath: 'momo',
  },
];
