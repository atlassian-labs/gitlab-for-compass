import styled from 'styled-components';
import { gridSize } from '@atlaskit/theme';
import { token } from '@atlaskit/tokens';

export const IconWrapper = styled.div`
  margin-left: ${gridSize() / 2}px;
`;

export const OptionWrapper = styled.div`
  display: flex;
  align-items: center;
`;

export const LabelWrapper = styled.div`
  padding-left: ${gridSize()}px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

export const EmptyStateWrapper = styled.div`
  padding: ${token('space.050', '4px')};
`;

export const EmptyStateDescription = styled.p`
  color: ${token('color.text.disabled', '#091E424F')};
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 20px;
  text-align: center;
`;
