import { HeadType } from '@atlaskit/dynamic-table/types';

type Props = {
  isOnboardingFlow: boolean;
};

export const buildTableHead = ({ isOnboardingFlow }: Props): HeadType => {
  return {
    cells: [
      { key: 'name', content: 'Name', isSortable: false, width: isOnboardingFlow ? 30 : 20 },
      ...(!isOnboardingFlow
        ? [
            {
              key: 'description',
              content: 'Description',
              isSortable: false,
              width: 50,
            },
          ]
        : [{}]),
      { key: 'type', content: 'Component type', isSortable: false, width: isOnboardingFlow ? 50 : 15 },
      ...(!isOnboardingFlow
        ? [
            {
              key: 'OWNER_TEAM',
              content: 'Owner team',
              width: 15,
            },
          ]
        : [{}]),
    ],
  };
};
