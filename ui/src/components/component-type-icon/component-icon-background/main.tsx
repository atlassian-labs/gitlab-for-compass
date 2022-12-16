import { Size } from '@atlaskit/icon';
import { B200, Y400, P300, N100 } from '@atlaskit/theme/colors';
import { CompassComponentType } from '@atlassian/forge-graphql/dist/src/graphql-types';

import { IconBackground } from './styled';

type ComponentIconBackgroundProps = {
  type: CompassComponentType;
  size?: Size;
  testId?: string;
  children?: React.ReactNode;
};

const getBackgroundColor = (type: CompassComponentType) => {
  switch (type) {
    case CompassComponentType.Application:
      return B200;
    case CompassComponentType.Library:
      return Y400;
    case CompassComponentType.Service:
      return P300;
    case CompassComponentType.Other:
    default:
      return N100;
  }
};

/**
 * Creates an IconBackground with a color based on the type of component.
 */
export function ComponentIconBackground(props: ComponentIconBackgroundProps): JSX.Element {
  const { type, size = 'medium', testId, children } = props;

  const color = getBackgroundColor(type);

  return (
    <IconBackground data-testid={testId} size={size} colour={color}>
      {children}
    </IconBackground>
  );
}
