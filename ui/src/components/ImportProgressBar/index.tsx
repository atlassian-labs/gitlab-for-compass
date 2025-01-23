import ProgressBar from '@atlaskit/progress-bar';
import SectionMessage from '@atlaskit/section-message';

import { useEffect } from 'react';
import { useImportProgress } from '../../hooks/useImportProgress';
import { ProgressDescriptionWrapper } from './styles';
import { checkOnboardingRedirection } from '../onboarding-flow-context-helper';

export const ImportProgressBar = () => {
  const { error, importedRepositories, totalSelectedRepos } = useImportProgress();

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
