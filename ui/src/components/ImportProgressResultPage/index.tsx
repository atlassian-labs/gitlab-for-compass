import Button from '@atlaskit/button';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { gridSize } from '@atlaskit/theme';

import { router } from '@forge/bridge';
import { IMPORT_MODULE_KEY } from '../../constants';
import { useImportContext } from '../../hooks/useImportContext';
import { ApplicationState } from '../../routes';
import { ImportProgressBar } from '../ImportProgressBar';
import { ImportResult } from '../ImportResult';
import { checkOnboardingRedirection } from '../onboarding-flow-context-helper';

const DoneButtonWrapper = styled.div`
  margin-top: ${gridSize() * 2}px;
`;

type Props = {
  moduleKey: string;
};

export const ImportProgressResultPage = ({ moduleKey }: Props) => {
  const { isImportInProgress } = useImportContext();

  const navigate = useNavigate();

  const handleNavigateWhenDone = async (e: React.MouseEvent) => {
    e.preventDefault();
    await checkOnboardingRedirection().catch((err) => {
      console.error('Error redirecting to onboarding:', err);
    });
    if (moduleKey === IMPORT_MODULE_KEY) {
      await router.navigate('/compass/components?status=pending');
    } else {
      const path = `..${ApplicationState.CONNECTED}`;
      navigate(path, { replace: true });
    }
  };

  return (
    <>
      {isImportInProgress ? <ImportProgressBar /> : <ImportResult />}

      <DoneButtonWrapper>
        <Button onClick={handleNavigateWhenDone}>Done</Button>
      </DoneButtonWrapper>
    </>
  );
};
