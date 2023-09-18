import styled from 'styled-components';

import { h400 } from '@atlaskit/theme/typography';
import { N200, N90, N900 } from '@atlaskit/theme/colors';
import { gridSize } from '@atlaskit/theme';
import { token } from '@atlaskit/tokens';

export const CenterWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

export const SectionWrapper = styled.div`
  padding-top: ${gridSize() * 1.5}px;
  padding-bottom: ${gridSize() * 1.5}px;
  width: inherit;
`;

export const ImportantText = styled.strong`
  ${h400()};
`;

export const StatusLabel = styled.span`
  color: ${token('color.text.inverse', N200)};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

export const TruncateDescription = styled.div<{ maxWidth: number | string }>`
  max-width: ${(props) => props.maxWidth}px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Description = styled.span`
  font-size: 14px;
  line-height: 20px;
  color: ${token('color.text', N900)}; // TODO check
`;

export const ImportButtonWrapper = styled.div`
  margin-top: ${gridSize() * 2}px;
  display: flex;
  flex-direction: row;
  align-items: center;

  > button {
    margin-right: ${gridSize()}px;
  }

  time {
    color: ${token('color.text.subtlest', N90)};
    font-size: 11px;
  }
`;

export const TableWrapper = styled.div`
  margin-top: ${gridSize() * 4}px;
  max-height: 60vh;
  overflow: auto;
`;
