import Tooltip from '@atlaskit/tooltip';
import Checkbox from '@atlaskit/checkbox';
import { RowType } from '@atlaskit/dynamic-table/dist/types/types';

import { CompassComponentTypeOption, ComponentTypesResult, ProjectImportSelection } from '../../services/types';
import { ForgeLink } from '../ForgeLink';
import { getComponentTypeOption, tooltipsText } from '../utils';
import { TruncateDescription } from '../styles';
import { TooltipGenerator } from '../TooltipGenerator';
import { DropdownWrapper } from './styles';
import ComponentTypeSelect from '../ComponentTypeSelect';
import { DEFAULT_COMPONENT_TYPE_ID } from '../../constants';

type Props = {
  projects: ProjectImportSelection[];
  onSelectItem: (id: number) => void;
  onChangeComponentType: (id: number, type: CompassComponentTypeOption) => void;
  importableComponentTypes: ComponentTypesResult;
};

const mapStatus = (isManaged: boolean, isCompassFilePrOpened: boolean, hasComponent: boolean) => {
  if (isManaged) {
    return (
      <TooltipGenerator title={tooltipsText.managed.title} description={tooltipsText.managed.description}>
        {tooltipsText.managed.children}
      </TooltipGenerator>
    );
  }
  if (isCompassFilePrOpened) {
    return (
      <TooltipGenerator title={tooltipsText.inProgress.title} description={tooltipsText.inProgress.description}>
        {tooltipsText.inProgress.children}
      </TooltipGenerator>
    );
  }
  if (hasComponent) {
    return (
      <TooltipGenerator title={tooltipsText.created.title} description={tooltipsText.created.description}>
        {tooltipsText.created.children}
      </TooltipGenerator>
    );
  }

  return '-';
};

export const buildTableBody = ({
  projects,
  onSelectItem,
  onChangeComponentType,
  importableComponentTypes,
}: Props): RowType[] => {
  return projects.map((project) => {
    const {
      id,
      name,
      description,
      url,
      isSelected,
      groupFullPath,
      groupPath,
      typeOption,
      isManaged,
      isCompassFilePrOpened,
      hasComponent,
    } = project;

    return {
      key: `${id}`,
      cells: [
        {
          key: 'checkbox',
          content: (
            <div data-testid={`checkbox-${id}`}>
              <Checkbox
                isDisabled={isManaged || isCompassFilePrOpened}
                value={id}
                isChecked={isSelected}
                onChange={() => onSelectItem(id)}
              />
            </div>
          ),
        },
        {
          key: 'name',
          content: (
            <ForgeLink to={url} openInNewTab>
              {name}
            </ForgeLink>
          ),
        },
        {
          key: 'groupPath',
          content: (
            <Tooltip content={groupFullPath || '-'} position='left-start'>
              <TruncateDescription maxWidth='300'>{groupPath || '-'}</TruncateDescription>
            </Tooltip>
          ),
        },
        {
          key: 'description',
          content: (
            <Tooltip content={description || '-'} position='left-start'>
              <TruncateDescription maxWidth='300'>{description || '-'}</TruncateDescription>
            </Tooltip>
          ),
        },
        {
          key: 'status',
          content: mapStatus(isManaged, isCompassFilePrOpened, hasComponent),
        },
        {
          key: 'type',
          content: (
            <DropdownWrapper data-testid={`select-${id}`}>
              <ComponentTypeSelect
                loading={importableComponentTypes.componentTypesLoading}
                dropdownId={id.toString()}
                componentTypes={importableComponentTypes.componentTypes}
                isDisabled={isManaged || isCompassFilePrOpened || hasComponent}
                selectedOption={typeOption}
                onChange={(value) =>
                  onChangeComponentType(id, value ?? getComponentTypeOption(DEFAULT_COMPONENT_TYPE_ID))
                }
              />
            </DropdownWrapper>
          ),
        },
      ],
    };
  });
};
