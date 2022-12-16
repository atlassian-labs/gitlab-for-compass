import { CompassComponentType } from '@atlassian/forge-graphql/dist/src/graphql-types';
import { Link } from '@atlassian/forge-graphql';

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
    type: {
      label: 'label',
      value: CompassComponentType.Service,
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
    hasComponent: true,
    isCompassFilePrOpened: false,
    isManaged: true,
    groupFullPath: 'koko',
    groupName: 'koko',
    groupPath: 'koko',
  },
];
