import { gridSize } from '@atlaskit/theme';
import { R400, G500 } from '@atlaskit/theme/colors';
import { token } from '@atlaskit/tokens';
import styled from 'styled-components';

export const NameWrapper = styled.div`
  margin: ${gridSize()}px 0;
`;

export const ImportResultCounterWrapper = styled.div`
  padding-top: ${gridSize() * 2}px;
  display: flex;
`;

export const ErrorInfo = styled.span`
  color: ${token('color.text.danger', R400)};
  font-size: 14px;
  line-height: 20px;
  margin: ${gridSize() * 0.25}px 0 0 ${gridSize() - 3}px;
`;

export const SuccessInfo = styled.span`
  color: ${token('color.text.success', G500)};
  font-size: 14px;
  line-height: 20px;
  margin: ${gridSize() * 0.25}px 0 0 ${gridSize() - 3}px;
`;
