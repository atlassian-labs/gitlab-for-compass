import styled from 'styled-components';

import { N30A, N0 } from '@atlaskit/theme/colors';
import { gridSize, elevation, borderRadius } from '@atlaskit/theme';
import { TooltipPrimitive } from '@atlaskit/tooltip';
import { token } from '@atlaskit/tokens';

export const Separator = styled.div`
  background-color: ${token('color.border', N30A)};
  height: 2px;
  margin: ${gridSize()}px 0px;
`;

export const TooltipDialog = styled(TooltipPrimitive)`
  ${elevation.e200}
  background: ${N0};
  border-radius: ${borderRadius}px;
  box-sizing: content-box;
  padding: ${gridSize()}px ${gridSize() * 1.5}px;
`;

export const TooltipWrapper = styled.div`
  display: flex;
  flex-flow: column;
  max-width: 230px;
`;
