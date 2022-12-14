import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '@atlaskit/button';
import Spinner from '@atlaskit/spinner';
import InlineMessage from '@atlaskit/inline-message';
import { router } from '@forge/bridge';

import { ApplicationState } from '../../routes';
import { ImportProgressBar } from '../ImportProgressBar';
import { useImportContext } from '../../hooks/useImportContext';
import { getLastSyncTime } from '../../services/invokes';
import { formatLastSyncTime } from '../../helpers/time';
import { ImportButtonWrapper } from '../styles';
import { useAppContext } from '../../hooks/useAppContext';

type Props = {
  groupName: string;
  groupId: number;
};

export const ImportControls = ({ groupName, groupId }: Props) => {
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [lastSyncTimeIsLoading, setLastSyncTimeIsLoading] = useState<boolean>(false);
  const [lastSyncTimeErrorMessage, setLastSyncTimeAnErrorMessage] = useState<string>();

  const { isImportInProgress } = useImportContext();
  const { appId } = useAppContext();

  const navigate = useNavigate();

  const handleImportNavigate = () => {
    router.navigate(`/compass/import/redirect/${encodeURIComponent(`ari:cloud:ecosystem::app/${appId}`)}`);
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
    fetchLastSyncTime();
  }, []);

  const lastSyncTimeMsg = lastSyncTime ? `Last imported: ${formatLastSyncTime(lastSyncTime)}` : 'No import history';

  return (
    <>
      <h3>Import projects</h3>
      <p>
        Import projects from <strong>{groupName}</strong> as components to track in Compass.
      </p>

      {isImportInProgress ? (
        <ImportProgressBar />
      ) : (
        <ImportButtonWrapper>
          <Button appearance='primary' onClick={handleImportNavigate}>
            Import
          </Button>

          {lastSyncTimeIsLoading && <Spinner data-testid='loading-spinner' />}
          {lastSyncTimeErrorMessage && (
            <InlineMessage testId='error-message' type='error' title={`Can't get last imported time`}>
              <p>{lastSyncTimeErrorMessage}</p>
            </InlineMessage>
          )}
          {!lastSyncTimeIsLoading && !lastSyncTimeErrorMessage && (
            <time data-testid='last-import-time'>{lastSyncTimeMsg}</time>
          )}
        </ImportButtonWrapper>
      )}
    </>
  );
};
