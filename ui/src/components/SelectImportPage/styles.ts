import styled from 'styled-components';
import { gridSize } from '@atlaskit/theme';
import { h700 } from '@atlaskit/theme/typography';
import { N800 } from '@atlaskit/theme/colors';
import { token } from '@atlaskit/tokens';
import { Description } from '../styles';

export const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin: ${gridSize() * -2}px 0px;
  > button:not(:first-child) {
    margin-left: ${gridSize()}px;
  }
`;

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: inherit;
`;

export const Header = styled.span`
  ${h700};
  color: ${token('color.text', N800)};
  margin: 0;
`;

export const OverrideDescription = styled(Description)`
  margin-top: ${gridSize() * 2}px;
`;

export const StatusWrapper = styled.div`
  display: flex;
  align-items: center;
`;

export const ErrorWrapper = styled.div`
  margin-top: ${gridSize() * 2}px;
`;

export const DescriptionWrapper = styled.div`
  margin: 12px 0;
`;

export const RootWrapper = styled.div<{ isOnboardingFlow: boolean }>`
  display: flex;
  flex-direction: column;
  max-width: ${({ isOnboardingFlow }) => (isOnboardingFlow ? '100%' : '70%')};
`;

export const OptionContainer = styled.div`
  display: flex;
  align-items: center;
`;

export const LabelContainer = styled.div`
  padding-left: 8px;
`;

export const TableHeaderWrapper = styled.div`
  margin-top: ${gridSize() * 5}px;
  display: flex;
  justify-content: space-between;
`;

export const GroupSelectorWrapper = styled.div`
  width: ${gridSize() * 30}px;
`;

export const TableSearchWrapper = styled.div`
  width: ${gridSize() * 30}px;
`;

export const TableWrapper = styled.div`
  margin-top: ${gridSize() * 4}px;
`;
