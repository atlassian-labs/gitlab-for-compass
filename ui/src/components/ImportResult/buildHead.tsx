import { HeadType } from '@atlaskit/dynamic-table/dist/types/types';

export const buildHead = (): HeadType => {
  return {
    cells: [
      {
        key: 'NAME',
        content: 'Name',
        width: 20,
        isSortable: false,
      },
      {
        key: 'DESCRIPTION',
        content: 'Description',
        width: 80,
        isSortable: false,
      },
    ],
  };
};
