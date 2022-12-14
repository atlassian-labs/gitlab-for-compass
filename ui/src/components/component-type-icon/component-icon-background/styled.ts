import styled from 'styled-components';

import { Size, sizes } from '@atlaskit/icon';
import { borderRadius } from '@atlaskit/theme';

type IconBackgroundProps = {
  size: Size;
  colour: string;
};

export const IconBackground = styled.div<IconBackgroundProps>`
  display: flex;
  align-items: center;
  justify-content: center;

  width: ${(props) => sizes[props.size]};
  height: ${(props) => sizes[props.size]};

  background-color: ${(props) => props.colour};
  border-radius: ${borderRadius}px;

  // The ComponentIconGlyph is typically placed inside this background and uses
  // the same standard AtlasKit sizes. We need to shrink it so that it's not
  // flush to the edges of this background.
  & > svg,
  & > span[role='img'],
  & > span[role='presentation'] {
    width: 80%;
  }
`;
