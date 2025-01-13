import styled from 'styled-components';
import { token } from '@atlaskit/tokens';
import { N300A } from '@atlaskit/theme/colors';

export const ButtonWrapper = styled.div`
  margin-top: ${token('space.200', '16px')};
  display: flex;
  gap: ${token('space.100', '8px')};
`;

export const ImportComponentStateWrapper = styled.div`
  padding: ${token('space.150', '12px')};
  height: 200px;
  border: ${token('space.025', '2px')} solid ${token('color.border', N300A)};
  border-radius: ${token('space.050', '4px')};
  overflow: auto;
`;

export const RepoName = styled.p`
  width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const FailedReposWrapper = styled.div`
  display: flex;
  gap: ${token('space.100', '8px')};
`;

export const FailedReposTextWrapper = styled.p`
  margin-top; ${token('space.025', '2px')};
`;
