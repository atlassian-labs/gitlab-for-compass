import styled, { css } from 'styled-components';

import { h400 } from '@atlaskit/theme/typography';
import { N200, N90, N900, N40 } from '@atlaskit/theme/colors';
import { gridSize, borderRadius } from '@atlaskit/theme';
import { token } from '@atlaskit/tokens';

export const Padding = styled.div`
  margin-top: ${gridSize() * -1}px;
`;

export const CenterWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${gridSize() * -1}px;
`;

export const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin: ${gridSize() * -2}px 0px;
  > button:not(:first-child) {
    margin-left: ${gridSize()}px;
    margin-right: ${gridSize()}px;
  }
`;

export const Divider = styled.hr`
  border: none;
  background-color: ${token('color.border', N40)};
  height: 2px;
  border-radius: ${borderRadius}px;
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
  color: ${token('color.text', N900)};
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

const disableLastHeaderCellStylingForSpotlight = css`
  th:last-child {
    padding: 0;
  }
`;

export const TableWrapper = styled.div`
  margin-top: ${gridSize() * 4}px;
  max-height: 65vh;
  overflow: auto;
  padding-right: 12px;

  /* Hide scrollbar */
  scrollbar-width: none;
  -ms-overflow-style: none;

  ::-webkit-scrollbar {
    display: none;
  }

  ${disableLastHeaderCellStylingForSpotlight}
`;

export const IncomingWebhookSectionWrapper = styled.div`
  display: flex;
  background-color: ${token('color.background.accent.gray.subtlest', '#F1F2F4')};
  color: ${token('color.text.subtle', '#44546F')};
  border-radius: 4px;
  align-items: center;
  padding: 10px;
`;

export const IncomingWebhookIcon = styled.img`
  height: 34px;
  width: 34px;
  margin-right: 10px;
`;
