import Button from '@atlaskit/button';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { gridSize } from '@atlaskit/theme';

import { router } from '@forge/bridge';
import { useCallback, useEffect, useState } from 'react';
import { IMPORT_MODULE_KEY } from '../../constants';
import { useImportContext } from '../../hooks/useImportContext';
import { ApplicationState } from '../../routes';
import { ImportProgressBar } from '../ImportProgressBar';
import { ImportResult } from '../ImportResult';
import { checkOnboardingRedirection, isRenderingInOnboardingFlow } from '../onboarding-flow-context-helper';
import { useImportResult } from '../../hooks/useImportResult';

const DoneButtonWrapper = styled.div`
  margin-top: ${gridSize() * 2}px;
`;

type Props = {
  moduleKey: string;
};

export const ImportProgressResultPage = ({ moduleKey }: Props) => {
  const { isImportInProgress } = useImportContext();
  const [isOnboardingFlow, setOnboardingFlow] = useState<boolean>(false);

  useEffect(() => {
    const processAsync = async () => {
      const isOnboarding = await isRenderingInOnboardingFlow();
      setOnboardingFlow(isOnboarding);
    };

    processAsync().catch((e) => {
      console.error(`Failed to get onboarding state: ${e}`);
    });
  }, []);

  const navigate = useNavigate();

  const { totalProjects } = useImportResult();

  const handleNavigateWhenDone = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      await checkOnboardingRedirection(undefined, totalProjects).catch((err) => {
        console.error('Error redirecting to onboarding:', err);
      });
      if (moduleKey === IMPORT_MODULE_KEY) {
        await router.navigate('/compass/components?status=pending');
      } else {
        const path = `..${ApplicationState.CONNECTED}`;
        navigate(path, { replace: true });
      }
    },
    [totalProjects],
  );

  return (
    <>
      {isImportInProgress ? <ImportProgressBar /> : <ImportResult />}

      <DoneButtonWrapper>
        <Button isDisabled={isOnboardingFlow && isImportInProgress} onClick={handleNavigateWhenDone}>
          Done
        </Button>
      </DoneButtonWrapper>
    </>
  );
};
