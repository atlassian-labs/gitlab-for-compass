import { CompassComponentType } from '@atlassian/forge-graphql/dist/src/graphql-types';
import { Link } from '@atlassian/forge-graphql';
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

export const componentTypesWithTemplateResultMock = {
  componentTypesLoading: false,
  error: null,
  componentTypes: [
    {
      id: 'SERVICE',
    },
    {
      id: 'TEMPLATE',
    },
  ],
};
export const componentTypesErrorResultMock = {
  componentTypesLoading: false,
  error: null,
  componentTypes: [],
};
