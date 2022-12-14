import Select from '@atlaskit/select';
import { RowType } from '@atlaskit/dynamic-table/types';
import { ForgeLink } from '../ForgeLink';
import { FormatOptionLabel } from '../FormatOptionLabel';
import { COMPONENT_TYPE_OPTIONS } from '../utils';
import { CompassComponentTypeOption, ProjectImportSelection } from '../../services/types';

export interface SelectedProjectsProps {
  projectsReadyToImport: ProjectImportSelection[];
  onChangeComponentType: (id: number, type: CompassComponentTypeOption) => void;
}

export const buildTableBody = ({ projectsReadyToImport, onChangeComponentType }: SelectedProjectsProps): RowType[] => {
  return projectsReadyToImport.map((project) => {
    return {
      key: project.id.toString(),
      role: 'row',
      style: {
        borderBottom: '1px solid #DFE1E6',
      },
      cells: [
        {
          key: 'name',
          content: (
            <ForgeLink to={project.url} openInNewTab>
              {project.name}
            </ForgeLink>
          ),
        },
        {
          key: 'description',
          content: project.description,
        },
        {
          key: 'type',
          content: (
            <Select
              key={project.id}
              classNamePrefix='type-selector'
              isDisabled={project.isManaged || project.isCompassFilePrOpened || project.hasComponent}
              formatOptionLabel={FormatOptionLabel}
              value={project.type ?? COMPONENT_TYPE_OPTIONS[0]}
              options={COMPONENT_TYPE_OPTIONS}
              onChange={(value) => {
                onChangeComponentType(project.id, value || COMPONENT_TYPE_OPTIONS[0]);
              }}
            />
          ),
        },
      ],
    };
  });
};
