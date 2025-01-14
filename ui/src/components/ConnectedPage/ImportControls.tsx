import { useEffect, useState } from 'react';

import Button from '@atlaskit/button';
import Spinner from '@atlaskit/spinner';
import InlineMessage from '@atlaskit/inline-message';
import { router } from '@forge/bridge';

import { getCallBridge } from '@forge/bridge/out/bridge';
import { useNavigate } from 'react-router-dom';
import { ImportProgressBar } from '../ImportProgressBar';
import { useImportContext } from '../../hooks/useImportContext';
import { getLastSyncTime } from '../../services/invokes';
import { formatLastSyncTime } from '../../helpers/time';
import { ImportButtonWrapper, LastSyncTimeWrapper, StartImportButtonWrapper } from '../styles';
import { useAppContext } from '../../hooks/useAppContext';
import { Separator } from '../TooltipGenerator/styles';
import { ApplicationState } from '../../routes';

export const ImportControls = () => {
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [lastSyncTimeIsLoading, setLastSyncTimeIsLoading] = useState<boolean>(false);
  const [lastSyncTimeErrorMessage, setLastSyncTimeAnErrorMessage] = useState<string>();

  const { isImportInProgress } = useImportContext();
  const { appId, features } = useAppContext();
  const navigate = useNavigate();

  const handleImportNavigate = async () => {
    await router.navigate(`/compass/import/redirect/${encodeURIComponent(`ari:cloud:ecosystem::app/${appId}`)}`);
  };

  const handleImportAllButton = async () => {
    const actionSubject = 'importAllButton';
    const action = 'clicked';

    await getCallBridge()('fireForgeAnalytic', {
      forgeAppId: appId,
      analyticEvent: `${actionSubject} ${action}`,
    });

    navigate(`${ApplicationState.CONNECTED}/import-all`, { replace: true });
  };

  const fetchLastSyncTime = async () => {
    setLastSyncTimeIsLoading(true);

    try {
      const { data: time, success, errors } = await getLastSyncTime();
      if (success && time) {
        setLastSyncTime(time);
      }

      if (errors && errors.length > 0) {
        setLastSyncTimeAnErrorMessage(errors[0].message);
      }
    } catch (error) {
      setLastSyncTimeAnErrorMessage((error as Error).message);
    } finally {
      setLastSyncTimeIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLastSyncTime().catch((e) => {
      console.log('Error while fetching last sync time', e);
    });
  }, []);

  const lastSyncTimeMsg = lastSyncTime ? `Last imported: ${formatLastSyncTime(lastSyncTime)}` : 'No import history';

  return (
    <>
      <h4>Import projects</h4>
      <p>Import projects from your connected group to track as components in Compass.</p>

      {isImportInProgress ? (
        <ImportProgressBar />
      ) : (
        <>
          {features.isImportAllEnabled && (
            <StartImportButtonWrapper>
              <ImportButtonWrapper shouldShowImportAll={Boolean(features.isImportAllEnabled)}>
                <Button
                  shouldFitContainer
                  testId='import-all-repositories-btn'
                  appearance='primary'
                  onClick={handleImportAllButton}
                >
                  Import all repositories
                </Button>
              </ImportButtonWrapper>
            </StartImportButtonWrapper>
          )}
          {features.isImportAllEnabled && <Separator />}
          <StartImportButtonWrapper>
            <ImportButtonWrapper shouldShowImportAll={Boolean(features.isImportAllEnabled)}>
              <Button
                shouldFitContainer
                testId='import-repositories-btn'
                appearance={features.isImportAllEnabled ? 'default' : 'primary'}
                onClick={handleImportNavigate}
              >
                Import
              </Button>
            </ImportButtonWrapper>
          </StartImportButtonWrapper>
          <LastSyncTimeWrapper>
            {lastSyncTimeIsLoading && <Spinner data-testid='loading-spinner' />}
            {lastSyncTimeErrorMessage && (
              <InlineMessage testId='error-message' type='error' title={`Can't get last imported time`}>
                <p>{lastSyncTimeErrorMessage}</p>
              </InlineMessage>
            )}
            {!lastSyncTimeIsLoading && !lastSyncTimeErrorMessage && (
              <time data-testid='last-import-time'>{lastSyncTimeMsg}</time>
            )}
          </LastSyncTimeWrapper>
        </>
      )}
    </>
  );
};
