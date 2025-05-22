import { CompassComponentType, Link } from '@atlassian/forge-graphql-types';
import { DEFAULT_COMPONENT_TYPE_ID } from '../../../../constants';

export const groupMock = [
  {
    full_name: 'koko-momo',
    name: 'momo',
    id: 1223,
    path: 'koko/momo',
  },
];

export const projectImportSelectionMock = [
  {
    isSelected: false,
    typeOption: {
      label: 'label',
      value: DEFAULT_COMPONENT_TYPE_ID,
    },
    id: 2,
    name: 'a',
    description: 'description',
    defaultBranch: 'default_branch',
    labels: ['label', 'language:javascript'],
    url: 'web_url',
    componentId: '',
    componentLinks: [] as unknown as Link[],
    componentType: CompassComponentType.Application,
    typeId: 'APPLICATION',
    hasComponent: true,
    isCompassFilePrOpened: false,
    isManaged: true,
    groupFullPath: 'koko',
    groupName: 'koko',
    groupPath: 'koko',
    ownerTeamOption: { value: 'test-team', label: 'test-team', iconUrl: 'https://google.com' },
  },
];

export const componentTypesResultMock = {
  componentTypesLoading: false,
  error: null,
  componentTypes: [
    {
      id: 'SERVICE',
    },
    {
      id: 'APPLICATION',
    },
    {
      id: 'MACHINE_LEARNING_MODEL',
    },
  ],
};

export const componentTypesErrorResultMock = {
  componentTypesLoading: false,
  error: null,
  componentTypes: [],
};

export const teamsResult = {
  isTeamsDataLoading: false,
  teams: {
    teamsWithMembership: [
      {
        teamId: 'test',
        displayName: 'test',
        imageUrl: 'https://test.com',
      },
    ],
    otherTeams: [
      {
        teamId: 'test-1',
        displayName: 'test-1',
        imageUrl: 'https://test-1.com',
      },
    ],
  },
  error: undefined,
};
