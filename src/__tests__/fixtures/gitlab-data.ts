import { CompassComponent, CompassComponentType } from '@atlassian/forge-graphql-types';
import { CommitFileDiff, MergeRequest } from '../../types';

export const TEST_COMPONENT_ID =
  'ari:cloud:compass:4958bb5d-3970-4a13-bebc-62bbca57f370:component/5ce8c075-7b72-4455-9be9-7f0a1c6e6db4/23b718b0-26a9-4654-9a48-4390a3e811dd';

export const TEST_TOKEN = 'glpat-geTHYDSDGHJJ';

export const TEST_GET_PROJECT_BY_ID_RESPONSE = {
  id: 1,
  name: 'koko',
  description: 'description',
  default_branch: 'default_branch',
  topics: ['koko', 'momo'],
  web_url: 'web_url',
  namespace: {
    id: 1,
    full_path: 'path/group/koko',
    path: 'group/koko',
    name: 'group/koko',
  },
  created_at: expect.anything(),
};

export const mergeRequests = [
  {
    created_at: '2022-02-10T15:49:16Z',
    merged_at: '2022-02-10T15:57:02Z',
  },
  {
    created_at: '2022-02-08T15:49:37Z',
    merged_at: '2022-02-08T16:06:44Z',
  },
] as MergeRequest[];

export const MOCK_CLOUD_ID = '0a44684d-52c3-4c0c-99f8-9d89ec294759';

export const MOCK_GROUP_DATA = {
  name: 'koko',
  id: 123,
  full_name: 'GitLab/koko',
  path: 'koko/momo',
};

export const mockComponent: CompassComponent = {
  id: '1',
  name: 'mock',
  type: CompassComponentType.Service,
  typeId: 'service',
  description: null,
  fields: [],
  ownerId: null,
  links: null,
  relationships: null,
  changeMetadata: null,
};

export const commitDiffMock: CommitFileDiff = {
  diff: 'string',
  old_path: 'string',
  new_path: 'string',
  new_file: true,
  renamed_file: false,
  deleted_file: false,
};
