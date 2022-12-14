import styled from 'styled-components';

import CheckCircleIcon from '@atlaskit/icon/glyph/check-circle';
import { LoadingButton } from '@atlaskit/button';
import { N30 } from '@atlaskit/theme/colors';
import { gridSize } from '@atlaskit/theme';

import { GitlabAPIGroup } from '../../resolverTypes';

const ConnectedGroupWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid ${N30};
  border-radius: ${gridSize() / 2}px;
  padding: ${gridSize() * 2}px;
`;

const IconTitleGroupWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 80%;
`;

const ConnectedText = styled.p`
  margin: 0 0 0 5px;
`;

type Props = {
  connectedGroup: GitlabAPIGroup;
  handleDisconnectGroup: (id: number) => void;
  isDisconnectGroupInProgress: boolean;
};

export const ConnectInfoPanel = ({ connectedGroup, handleDisconnectGroup, isDisconnectGroupInProgress }: Props) => {
  return (
    <ConnectedGroupWrapper>
      <IconTitleGroupWrapper>
        <CheckCircleIcon label='check' primaryColor='green' />
        <ConnectedText>
          Your GitLab group <strong>{connectedGroup.name}</strong> is successfully connected to Compass
        </ConnectedText>
      </IconTitleGroupWrapper>
      <LoadingButton onClick={() => handleDisconnectGroup(connectedGroup.id)} isLoading={isDisconnectGroupInProgress}>
        Disconnect
      </LoadingButton>
    </ConnectedGroupWrapper>
  );
};
