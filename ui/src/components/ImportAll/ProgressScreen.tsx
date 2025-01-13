/* eslint-disable max-len */
import { useCallback, useEffect, useMemo } from 'react';
import SectionMessage from '@atlaskit/section-message';
import { Box, Flex, Text } from '@atlaskit/primitives';
import ProgressBar from '@atlaskit/progress-bar';
import Spinner from '@atlaskit/spinner';
import Button from '@atlaskit/button';
import { getCallBridge } from '@forge/bridge/out/bridge';
import {
  ButtonWrapper,
  FailedReposTextWrapper,
  FailedReposWrapper,
  ImportComponentStateWrapper,
  RepoName,
} from './styled';
import { mapStateToColor, mapStateToText } from './utils';
import { useAppContext } from '../../hooks/useAppContext';
import { IMPORT_STATE, useImportAll } from '../../hooks/useImportAll';
import { CenterWrapper } from '../styles';

export const ProgressScreen = ({
  handleRedirectToInfoScreen,
  handleRedirectToConnectedPage,
}: {
  handleRedirectToInfoScreen: () => void;
  handleRedirectToConnectedPage: () => void;
}) => {
  const { importedProjects, isImporting } = useImportAll();
  const { appId } = useAppContext();

  const isStartImportLoading = useMemo(() => importedProjects.length === 0, [importedProjects]);

  const importedProjectsByStatusCount = useCallback(
    (importStatus: IMPORT_STATE) =>
      importedProjects.filter((projectWithStatus) => projectWithStatus.state === importStatus).length,
    [importedProjects],
  );

  const successfullyImportedProjectsCount = useMemo(
    () => importedProjectsByStatusCount(IMPORT_STATE.SUCCESS),
    [importedProjectsByStatusCount],
  );

  const alreadyImportedProjectsCount = useMemo(
    () => importedProjectsByStatusCount(IMPORT_STATE.ALREADY_IMPORTED),
    [importedProjectsByStatusCount],
  );

  const failedImportedProjectsCount = useMemo(
    () => importedProjectsByStatusCount(IMPORT_STATE.FAILED),
    [importedProjectsByStatusCount],
  );

  const fireSuccessfullyImportedProjectsAnalytic = useCallback(async () => {
    const actionSubject = 'importAllResult';
    const action = 'imported';

    await getCallBridge()('fireForgeAnalytic', {
      forgeAppId: appId,
      analyticEvent: `${actionSubject} ${action}`,
      attributes: {
        successfullyImported: successfullyImportedProjectsCount,
      },
    });
  }, [importedProjectsByStatusCount, importedProjects]);

  useEffect(() => {
    if (!isImporting && importedProjects.length) {
      fireSuccessfullyImportedProjectsAnalytic().catch((error) => {
        console.log(`Error while sending successfully imported repos: ${error}`);
      });
    }
  }, [isImporting, importedProjects]);

  return (
    <div>
      <h4 data-testId='import-all.progress-screen.title'>Importing all repositories</h4>
      <SectionMessage appearance='information' data-testId='import-all.progress-screen.information'>
        <p>Please keep your browser open till the import operation completes.</p>
      </SectionMessage>
      <Box padding='space.150'>{isImporting && <ProgressBar isIndeterminate />}</Box>

      {isStartImportLoading ? (
        <CenterWrapper>
          <Spinner size='large' />
        </CenterWrapper>
      ) : (
        <>
          <Box padding='space.100'>
            {successfullyImportedProjectsCount > 0 && (
              <p>
                <Text weight='bold' data-testId='import-all.progress-screen.successfully-imported'>
                  {successfullyImportedProjectsCount}
                </Text>{' '}
                components imported successfully
              </p>
            )}
            {alreadyImportedProjectsCount > 0 && (
              <p>
                <Text weight='bold' data-testId='import-all.progress-screen.already-imported'>
                  {alreadyImportedProjectsCount}
                </Text>{' '}
                components were already imported
              </p>
            )}
            {failedImportedProjectsCount > 0 && (
              <FailedReposWrapper>
                <FailedReposTextWrapper>
                  <Text weight='bold' data-testId='import-all.progress-screen.failed-imported'>
                    {failedImportedProjectsCount}
                  </Text>{' '}
                  components failed to import
                </FailedReposTextWrapper>
              </FailedReposWrapper>
            )}
          </Box>
          <ImportComponentStateWrapper data-testId='import-all.progress-screen.import-progress'>
            {importedProjects.map((projectWithStatus, index) => {
              return (
                <Flex gap='space.200' key={`${projectWithStatus.name}-${index}`}>
                  <RepoName data-testId={`import-all.progress-screen.name.${projectWithStatus.name}`}>
                    {projectWithStatus.name}
                  </RepoName>
                  <Text
                    as='strong'
                    color={mapStateToColor(projectWithStatus.state)}
                    data-testId={`import-all.progress-screen.import-status.${projectWithStatus.name}.${projectWithStatus.state}`}
                  >
                    {mapStateToText(projectWithStatus.state)}
                  </Text>
                </Flex>
              );
            })}
          </ImportComponentStateWrapper>
        </>
      )}

      <ButtonWrapper>
        <Button onClick={handleRedirectToInfoScreen} testId='import-all.progress-screen.back-btn'>
          Go back
        </Button>
        <Button
          isDisabled={isImporting}
          onClick={handleRedirectToConnectedPage}
          testId='import-all.progress-screen.done-btn'
        >
          Done
        </Button>
      </ButtonWrapper>
    </div>
  );
};
