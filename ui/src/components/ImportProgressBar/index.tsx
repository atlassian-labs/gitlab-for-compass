import ProgressBar from '@atlaskit/progress-bar';
import SectionMessage from '@atlaskit/section-message';

import { useImportProgress } from '../../hooks/useImportProgress';
import { ProgressDescriptionWrapper } from './styles';

export const ImportProgressBar = () => {
  const { error, importedRepositories, totalSelectedRepos } = useImportProgress();

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
