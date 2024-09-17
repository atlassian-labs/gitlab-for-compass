import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Spinner from '@atlaskit/spinner';

import { disconnectGroup } from '../../services/invokes';
import { ConnectInfoPanel } from './ConnectInfoPanel';
import { ImportControls } from './ImportControls';
import { CenterWrapper } from '../styles';
import { DefaultErrorState } from '../DefaultErrorState';
import { ApplicationState } from '../../routes';
import { useAppContext } from '../../hooks/useAppContext';
import { AuthErrorTypes, ErrorTypes, GitlabAPIGroup } from '../../resolverTypes';
import { useImportContext } from '../../hooks/useImportContext';
import { ImportResult } from '../ImportResult';
import { IncomingWebhookSectionMessage } from '../IncomingWebhookSectionMessage';

export const ConnectedPage = () => {
  const [isDisconnectGroupInProgress, setDisconnectGroupInProgress] = useState(false);
  const [errorType, setErrorType] = useState<ErrorTypes>();
  const [groups, setGroups] = useState<GitlabAPIGroup[]>();

  const navigate = useNavigate();
  const { getConnectedInfo, clearGroup } = useAppContext();
  const { isImportInProgress } = useImportContext();

  const handleDisconnectGroup = async (id: number) => {
    setDisconnectGroupInProgress(true);
    try {
      const { success, errors } = await disconnectGroup(id);
      clearGroup(id);

      if (success) {
        setDisconnectGroupInProgress(false);
        navigate(`..${ApplicationState.AUTH}`, { replace: true });
      }
      if (errors && errors.length > 0) {
        setDisconnectGroupInProgress(false);
        setErrorType(errors[0].errorType || AuthErrorTypes.UNEXPECTED_ERROR);
      }
    } catch (err) {
      setErrorType(AuthErrorTypes.UNEXPECTED_ERROR);
    } finally {
      setDisconnectGroupInProgress(false);
    }
  };

  useEffect(() => {
    getConnectedInfo()
      .then(setGroups)
      .catch((e) => {
        console.error('Error while getting connected info', e);
      });
  }, []);

  if (errorType) {
    return <DefaultErrorState errorType={errorType} />;
  }

  if (!groups?.length) {
    return (
      <CenterWrapper>
        <Spinner size='large' />
      </CenterWrapper>
    );
  }

  return (
    <div data-testid='gitlab-connected-page'>
      <h4>Connected group</h4>
      <p>You can connect only one GitLab group to Compass at a time, and you must be an owner of that group.</p>
      <br />
      <IncomingWebhookSectionMessage />
      <br />
      <ConnectInfoPanel
        connectedGroup={groups[0]}
        handleDisconnectGroup={handleDisconnectGroup}
        isDisconnectGroupInProgress={isDisconnectGroupInProgress}
      />

      <ImportControls />

      {!isImportInProgress ? <ImportResult /> : null}
    </div>
  );
};
