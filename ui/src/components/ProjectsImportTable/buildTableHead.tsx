import Checkbox from '@atlaskit/checkbox';
import { HeadType } from '@atlaskit/dynamic-table/dist/types/types';

import { TooltipGenerator } from '../TooltipGenerator';
import { tooltipsText } from '../utils';
import { StatusWrapper } from '../SelectImportPage/styles';
import { ProjectImportSelection } from '../../services/types';

type Params = {
  projects: ProjectImportSelection[];
  onSelectAllItems: (filteredProjects: ProjectImportSelection[], isAllItemsSelected: boolean) => void;
  isAllItemsSelected: boolean;
  isLoading: boolean;
};

export const buildTableHead = ({ isLoading, onSelectAllItems, isAllItemsSelected, projects }: Params): HeadType => {
  return {
    cells: [
      {
        key: 'CHECKBOX',
        content: (
          <Checkbox
            isDisabled={isLoading || projects.length === 0}
            isChecked={isAllItemsSelected}
            onChange={() => onSelectAllItems(projects, isAllItemsSelected)}
          />
        ),
        width: 5,
        isSortable: false,
      },
      {
        key: 'NAME',
        content: 'Name',
        width: 10,
        isSortable: false,
      },
      {
        key: 'GROUP_NAME',
        content: 'Group name',
        width: 15,
        isSortable: false,
      },
      {
        key: 'DESCRIPTION',
        content: 'Description',
        width: 30,
        isSortable: false,
      },
      {
        key: 'STATUS',
        content: (
          <StatusWrapper>
            <p>Status</p>
            <TooltipGenerator
              title={tooltipsText.statusHeader.title}
              description={tooltipsText.statusHeader.description}
            >
              {tooltipsText.statusHeader.children}
            </TooltipGenerator>
          </StatusWrapper>
        ),
        width: 10,
        isSortable: false,
      },
      {
        key: 'COMPONENT_TYPE',
        content: 'Component type',
        width: 15,
      },
      {
        key: 'OWNER_TEAM',
        content: 'Owner team',
        width: 15,
      },
    ],
  };
};
