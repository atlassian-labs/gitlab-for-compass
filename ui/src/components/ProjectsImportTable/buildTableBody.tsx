import Select from '@atlaskit/select';
import Tooltip from '@atlaskit/tooltip';
import Checkbox from '@atlaskit/checkbox';
import { RowType } from '@atlaskit/dynamic-table/dist/types/types';

import { CompassComponentTypeOption, ProjectImportSelection } from '../../services/types';
import { ForgeLink } from '../ForgeLink';
import { COMPONENT_TYPE_OPTIONS, tooltipsText } from '../utils';
import { FormatOptionLabel } from '../FormatOptionLabel';
import { TruncateDescription } from '../styles';
import { TooltipGenerator } from '../TooltipGenerator';
import { DropdownWrapper } from './styles';

type Props = {
  projects: ProjectImportSelection[];
  onSelectItem: (id: number) => void;
  onChangeComponentType: (id: number, type: CompassComponentTypeOption) => void;
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

export const buildTableBody = ({ projects, onSelectItem, onChangeComponentType }: Props): RowType[] => {
  return projects.map((project) => {
    const {
      id,
      name,
      description,
      url,
      isSelected,
      groupFullPath,
      groupPath,
      type,
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
              <Select
                key={id}
                classNamePrefix='type-selector'
                isDisabled={isManaged || isCompassFilePrOpened || hasComponent}
                formatOptionLabel={FormatOptionLabel}
                value={type ?? COMPONENT_TYPE_OPTIONS[0]}
                options={COMPONENT_TYPE_OPTIONS}
                onChange={(value) => {
                  onChangeComponentType(id, value || COMPONENT_TYPE_OPTIONS[0]);
                }}
              />
            </DropdownWrapper>
          ),
        },
      ],
    };
  });
};
