import styled from 'styled-components';

import CheckCircleIcon from '@atlaskit/icon/glyph/check-circle';
import { LoadingButton } from '@atlaskit/button';
import { N30 } from '@atlaskit/theme/colors';
import { gridSize } from '@atlaskit/theme';

import { token } from '@atlaskit/tokens';
import { GitlabAPIGroup } from '../../resolverTypes';

const ConnectedGroupWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid ${token('color.border', N30)};
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
  isLoadingResync: boolean;
  handleResyncCaC: () => Promise<void>;
  isResyncConfigAsCodeEnabled?: boolean;
};

export const ConnectInfoPanel = ({
  connectedGroup,
  handleDisconnectGroup,
  isDisconnectGroupInProgress,
  isLoadingResync,
  handleResyncCaC,
  isResyncConfigAsCodeEnabled,
}: Props) => {
  return (
    <ConnectedGroupWrapper>
      <IconTitleGroupWrapper>
        <CheckCircleIcon label='check' primaryColor={token('color.icon.success', 'green')} />
        <ConnectedText>
          <strong>{connectedGroup.name}</strong>
        </ConnectedText>
      </IconTitleGroupWrapper>
      {isResyncConfigAsCodeEnabled && (
        <LoadingButton isLoading={isLoadingResync} onClick={handleResyncCaC}>
          Resync
        </LoadingButton>
      )}
      <LoadingButton onClick={() => handleDisconnectGroup(connectedGroup.id)} isLoading={isDisconnectGroupInProgress}>
        Disconnect
      </LoadingButton>
    </ConnectedGroupWrapper>
  );
};
