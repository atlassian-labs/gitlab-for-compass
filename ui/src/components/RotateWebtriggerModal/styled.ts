import styled from 'styled-components';
import { token } from '@atlaskit/tokens';

export const IconWrapper = styled.div`
  margin-right: ${token('space.100', '8px')};
`;

export const ModalHeaderWrapper = styled.div`
  display: flex;
  padding: ${token('space.300', '24px')};
  font-size: ${token('space.250', '20px')};
  font-weight: 500;
`;

export const ModalBodyWrapper = styled.div`
  padding: ${token('space.025', '2px')} ${token('space.300', '24px')};
`;

export const ModalFooterWrapper = styled.div`
  display: flex;
  padding: ${token('space.250', '22px')} ${token('space.300', '24px')} ${token('space.300', '24px')};
  justify-content: right;
`;
