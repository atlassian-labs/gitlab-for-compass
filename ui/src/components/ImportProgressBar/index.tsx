import ProgressBar from '@atlaskit/progress-bar';
import SectionMessage from '@atlaskit/section-message';

import { useCallback, useEffect } from 'react';
import { getCallBridge } from '@forge/bridge/out/bridge';
import { useImportProgress } from '../../hooks/useImportProgress';
import { ProgressDescriptionWrapper } from './styles';
import { checkOnboardingRedirection } from '../onboarding-flow-context-helper';
import { useAppContext } from '../../hooks/useAppContext';

export const ImportProgressBar = () => {
  const { error, importedRepositories, totalSelectedRepos } = useImportProgress();
  const { appId } = useAppContext();

  useEffect(() => {
    const redirect = async () => {
      await checkOnboardingRedirection('IMPORT_ERROR');
    };
    if (error) {
      redirect().catch((e) => {
        console.error(`Failed to redirect on error: ${e}`);
      });
    }
  }, [error]);

  useEffect(() => {
    const fireImportProgressBarAnalytic = async () => {
      const actionSubject = 'importProgressBar';
      const action = 'viewed';

      await getCallBridge()('fireForgeAnalytic', {
        forgeAppId: appId,
        analyticEvent: `${actionSubject} ${action}`,
      });
    };

    fireImportProgressBarAnalytic().catch((e) => {
      console.error(`Failed to fire import progress screen analytic: ${e}`);
    });
  }, []);

  if (error) {
    return (
      <SectionMessage title='Import progress status failed' appearance='information'>
        <p>Unfortunately, we can&apos;t show a current progress status. Please, refresh a page or try again later.</p>
      </SectionMessage>
    );
  }

  return (
    <>
      <ProgressBar isIndeterminate />
      <ProgressDescriptionWrapper>
        {importedRepositories} of {totalSelectedRepos} projects imported
      </ProgressDescriptionWrapper>
    </>
  );
};
