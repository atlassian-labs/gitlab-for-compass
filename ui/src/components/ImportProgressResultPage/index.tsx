import Button from '@atlaskit/button';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { gridSize } from '@atlaskit/theme';

import { router } from '@forge/bridge';
import { useImportContext } from '../../hooks/useImportContext';
import { ApplicationState } from '../../routes';
import { ImportProgressBar } from '../ImportProgressBar';
import { ImportResult } from '../ImportResult';
import { IMPORT_MODULE_KEY } from '../../constants';

const DoneButtonWrapper = styled.div`
  margin-top: ${gridSize() * 2}px;
`;

type Props = {
  moduleKey: string;
};

export const ImportProgressResultPage = ({ moduleKey }: Props) => {
  const { isImportInProgress } = useImportContext();

  const navigate = useNavigate();

  const handleNavigateWhenDone = () => {
    if (moduleKey === IMPORT_MODULE_KEY) {
      router.navigate('/compass/components');
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
