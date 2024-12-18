import { N200A, N300A } from '@atlaskit/theme/colors';
import styled from 'styled-components';
import { token } from '@atlaskit/tokens';
import { gridSize } from '@atlaskit/theme';

export const SectionMessageWrapper = styled.div`
  margin-bottom: ${gridSize() * 2}px;
`;

export const TokenRoleWrapper = styled.div`
  margin-bottom: ${gridSize() * 2}px;
  width: 350px;
`;

export const FormWrapper = styled.div`
  width: 350px;
`;

export const ReloadButtonWrapper = styled.div`
  > button {
    padding: 0;
  }
`;

export const CopyIconWrapper = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: ${token('space.025', '2px')};
  border-radius: ${token('border.radius', '3px')};
  cursor: pointer;
  color: ${token('color.icon.subtle')};

  &:hover {
    background-color: ${token('color.background.neutral.subtle.hovered', N200A)};
    color: ${token('color.icon')};
  }

  &:active {
    background-color: ${token('color.background.neutral.subtle.pressed', N300A)};
    color: ${token('color.icon')};
  }
`;
