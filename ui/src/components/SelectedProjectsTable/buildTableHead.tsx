import { HeadType } from '@atlaskit/dynamic-table/types';

export const buildTableHead = (isOwnerTeamEnabled: boolean): HeadType => {
  return {
    cells: [
      { key: 'name', content: 'Name', isSortable: false, width: 20 },
      {
        key: 'description',
        content: 'Description',
        isSortable: false,
        width: isOwnerTeamEnabled ? 50 : 65,
      },
      { key: 'type', content: 'Component type', isSortable: false, width: 15 },
      ...(isOwnerTeamEnabled
        ? [
            {
              key: 'OWNER_TEAM',
              content: 'Owner team',
              width: 15,
            },
          ]
        : []),
    ],
  };
};
