import { RowType } from '@atlaskit/dynamic-table/types';
import { ForgeLink } from '../ForgeLink';
import { CompassComponentTypeOption, ComponentTypesResult, ProjectImportSelection } from '../../services/types';
import ComponentTypeSelect from '../ComponentTypeSelect';
import { DEFAULT_COMPONENT_TYPE_ID } from '../../constants';
import { getComponentTypeOption } from '../utils';
import { OwnerTeamSelect } from '../OwnerTeamSelect';
import { SelectOwnerTeamOption } from '../OwnerTeamSelect/types';
import { TeamsForImportResult } from '../../hooks/useTeamsForImport';

export interface SelectedProjectsProps {
  projectsReadyToImport: ProjectImportSelection[];
  onChangeComponentType: (id: number, type: CompassComponentTypeOption) => void;
  importableComponentTypes: ComponentTypesResult;
  teamsResult: TeamsForImportResult;
  selectProjectTeam: (id: number, ownerTeamOption: SelectOwnerTeamOption | null) => void;
  isOnboardingFlow: boolean;
}

export const buildTableBody = ({
  projectsReadyToImport,
  onChangeComponentType,
  importableComponentTypes,
  teamsResult,
  selectProjectTeam,
  isOnboardingFlow,
}: SelectedProjectsProps): RowType[] => {
  return projectsReadyToImport.map((project) => {
    const selectTeam = (selectedOwnerTeamOption: SelectOwnerTeamOption | null) => {
      selectProjectTeam(project.id, selectedOwnerTeamOption);
    };

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
        ...(!isOnboardingFlow
          ? [
              {
                key: 'description',
                content: project.description,
              },
            ]
          : [{}]),

        {
          key: 'type',
          content: (
            <ComponentTypeSelect
              loading={importableComponentTypes.componentTypesLoading}
              dropdownId={project.id.toString()}
              componentTypes={importableComponentTypes.componentTypes}
              isDisabled={project.isManaged || project.isCompassFilePrOpened || project.hasComponent}
              selectedOption={project.typeOption}
              onChange={(value) =>
                onChangeComponentType(project.id, value ?? getComponentTypeOption(DEFAULT_COMPONENT_TYPE_ID))
              }
            />
          ),
        },
        ...(!isOnboardingFlow
          ? [
              {
                key: 'team',
                content: (
                  <OwnerTeamSelect
                    isDisabled={isOnboardingFlow}
                    selectKey={project.id.toString()}
                    teams={teamsResult.teams}
                    selectedTeamOption={project.ownerTeamOption}
                    isLoadingTeams={teamsResult.isTeamsDataLoading}
                    selectTeam={selectTeam}
                  />
                ),
              },
            ]
          : [{}]),
      ],
    };
  });
};
