import { Size } from '@atlaskit/icon';
import * as colors from '@atlaskit/theme/colors';

import { IconBackground } from './styled';
import { COMPONENT_TYPES } from '../../assets';

type ComponentIconBackgroundProps = {
  typeId: string;
  size?: Size;
  testId?: string;
  children?: React.ReactNode;
};

const getBackgroundColorByTypeId = (typeId: string) => {
  return (
    COMPONENT_TYPES.find((componentTypeData) => componentTypeData.id.toLowerCase() === typeId.toLowerCase())?.color ??
    colors.B200
  );
};

/**
 * Creates an IconBackground with a color based on the type of component.
 */
export function ComponentIconBackground(props: ComponentIconBackgroundProps): JSX.Element {
  const { typeId, size = 'medium', testId, children } = props;

  const color = getBackgroundColorByTypeId(typeId);

  return (
    <IconBackground data-testid={testId} size={size} colour={color}>
      {children}
    </IconBackground>
  );
}
