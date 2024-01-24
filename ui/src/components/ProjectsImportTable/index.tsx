import { useMemo } from 'react';
import { DynamicTableStateless } from '@atlaskit/dynamic-table';

import { buildTableBody } from './buildTableBody';
import { buildTableHead } from './buildTableHead';
import { buildEmptyView } from '../EmptyState/buildEmptyView';
import { CompassComponentTypeOption, ComponentTypesResult, ProjectImportSelection } from '../../services/types';
import { TableWrapper } from '../styles';
import { SelectOwnerTeamOption } from '../OwnerTeamSelect/types';
import { TeamsForImportResult } from '../../hooks/useTeamsForImport';

type Props = {
  projects: ProjectImportSelection[];
  isLoading: boolean;
  onSelectAllItems: (filteredProjects: ProjectImportSelection[], isAllItemsSelected: boolean) => void;
  onSelectItem: (id: number) => void;
  onChangeComponentType: (id: number, type: CompassComponentTypeOption) => void;
  error?: string;
  importableComponentTypes: ComponentTypesResult;
  teamsResult: TeamsForImportResult;
  selectProjectTeam: (id: number, ownerTeamOption: SelectOwnerTeamOption | null) => void;
};

const SPINNER_SIZE = 'large';

export const ProjectsImportTable = ({
  projects,
  isLoading,
  onSelectAllItems,
  onSelectItem,
  onChangeComponentType,
  error,
  importableComponentTypes,
  teamsResult,
  selectProjectTeam,
}: Props) => {
  const emptyView = useMemo(() => buildEmptyView({ isProjectsExist: projects.length !== 0, error }), [projects, error]);

  const isAllItemsSelected = useMemo(
    () => (isLoading ? false : projects.every(({ isSelected, isManaged }) => isSelected || isManaged)),
    [projects, isLoading],
  );

  return (
    <>
      <TableWrapper>
        <DynamicTableStateless
          testId='projects-import-table'
          head={buildTableHead({
            projects,
            onSelectAllItems,
            isAllItemsSelected,
            isLoading,
          })}
          rows={buildTableBody({
            projects,
            onSelectItem,
            onChangeComponentType,
            importableComponentTypes,
            teamsResult,
            selectProjectTeam,
          })}
          loadingSpinnerSize={SPINNER_SIZE}
          isLoading={isLoading}
          emptyView={emptyView}
        />
      </TableWrapper>
    </>
  );
};
