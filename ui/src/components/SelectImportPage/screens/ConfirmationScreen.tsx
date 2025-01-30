import { Checkbox } from '@atlaskit/checkbox';
import SectionMessage from '@atlaskit/section-message';
import Button, { LoadingButton } from '@atlaskit/button';

import { useCallback } from 'react';
import { getCallBridge } from '@forge/bridge/out/bridge';
import { ForgeLink } from '../../ForgeLink';
import { ButtonWrapper, DescriptionWrapper, ErrorWrapper, RootWrapper } from '../styles';
import { SelectedProjectsTable, SelectedProjectsProps } from '../../SelectedProjectsTable';
import { ImportErrorTypes, ResolverResponse } from '../../../resolverTypes';
import { ComponentTypesResult } from '../../../services/types';
import { SelectOwnerTeamOption } from '../../OwnerTeamSelect/types';
import { TeamsForImportResult } from '../../../hooks/useTeamsForImport';
import { useAppContext } from '../../../hooks/useAppContext';

type Props = {
  syncWithCompassYml: boolean;
  setSyncWithCompassYml: (value: boolean) => void;
  handleNavigateToScreen: () => void;
  isProjectsImporting: boolean;
  handleImportProjects: () => void;
  projectsImportingData: ResolverResponse | null;
  importableComponentTypes: ComponentTypesResult;
  teamsResult: TeamsForImportResult;
  selectProjectTeam: (id: number, ownerTeamOption: SelectOwnerTeamOption | null) => void;
};

export const ConfirmationScreen = ({
  projectsReadyToImport,
  onChangeComponentType,
  syncWithCompassYml,
  setSyncWithCompassYml,
  handleNavigateToScreen,
  isProjectsImporting,
  handleImportProjects,
  projectsImportingData,
  importableComponentTypes,
  teamsResult,
  selectProjectTeam,
  isOnboardingFlow,
}: Props & SelectedProjectsProps) => {
  const { appId } = useAppContext();

  const handleSetupImportCaC = async (value: boolean) => {
    const actionSubject = 'importSetupCaC';
    const action = value ? 'enabled' : 'disabled';

    await getCallBridge()('fireForgeAnalytic', {
      forgeAppId: appId,
      analyticEvent: `${actionSubject} ${action}`,
    });
  };

  const handleChangeIsSelected = useCallback(async () => {
    setSyncWithCompassYml(!syncWithCompassYml);
    handleSetupImportCaC(!syncWithCompassYml).catch((e) => {
      console.error(`Failed to fire analytic: ${e}`);
    });
  }, [syncWithCompassYml]);

  return (
    <>
      <RootWrapper isOnboardingFlow={isOnboardingFlow}>
        <h4>Set up configuration files</h4>
        <DescriptionWrapper>
          <p>
            Manage components with configuration files in the connected GitLab workspace and sync any updates back to
            Compass.{' '}
            <ForgeLink
              to='https://developer.atlassian.com/cloud/compass/config-as-code/what-is-config-as-code/'
              openInNewTab
            >
              Learn more about managing components with config-as-code
            </ForgeLink>
          </p>
          <p>
            You can choose to let Compass set up the configuration files for all your components during the import. Or,
            you can import your components first, and then set up the configuration files manually later.
          </p>
        </DescriptionWrapper>
        <DescriptionWrapper>
          <div data-testid='sync-with-compass-yml'>
            <Checkbox
              isChecked={syncWithCompassYml}
              onChange={handleChangeIsSelected}
              label='Set up configuration files for all projects during import'
            />
          </div>
        </DescriptionWrapper>
        {syncWithCompassYml && (
          <>
            <SectionMessage appearance={'information'} title={''}>
              <p>
                When you start the import, Compass adds the compass.yml configuration file to each project and raises
                merge requests. Approve and merge the merge requests for the projects to sync with Compass.
              </p>
            </SectionMessage>
          </>
        )}
      </RootWrapper>
      <SelectedProjectsTable
        projectsReadyToImport={projectsReadyToImport}
        onChangeComponentType={onChangeComponentType}
        importableComponentTypes={importableComponentTypes}
        teamsResult={teamsResult}
        selectProjectTeam={selectProjectTeam}
        isOnboardingFlow={isOnboardingFlow}
      />
      {projectsImportingData?.errors && projectsImportingData.errors.length !== 0 && (
        <ErrorWrapper>
          {projectsImportingData.errors[0].errorType === ImportErrorTypes.ONE_TIME_IMPORT_LIMIT && (
            <SectionMessage title='Temporary limitation' appearance='warning'>
              <p>{projectsImportingData.errors[0].message}</p>
            </SectionMessage>
          )}
          {projectsImportingData.errors[0].errorType === ImportErrorTypes.UNEXPECTED_ERROR && (
            <SectionMessage title='Something went wrong, try again later' appearance='error'>
              <p>{projectsImportingData.errors[0].message}</p>
            </SectionMessage>
          )}
        </ErrorWrapper>
      )}
      <ButtonWrapper>
        <Button onClick={() => handleNavigateToScreen()}>Edit Selection</Button>
        <LoadingButton appearance='primary' onClick={handleImportProjects} isLoading={isProjectsImporting}>
          Start Import
        </LoadingButton>
      </ButtonWrapper>
    </>
  );
};
