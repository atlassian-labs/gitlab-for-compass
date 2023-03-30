import Icon, { CustomGlyphProps } from '@atlaskit/icon';
import { GlyphProps } from '@atlaskit/icon/types';

import { COMPONENT_TYPES, CompassIconsProps } from '../../assets';
import { capitalize } from '../../utils';

export type ComponentIconGlyphProps = CompassIconsProps & {
  typeId: string;
};

function getComponentTypeIdData(typeId: string): React.FunctionComponent<CustomGlyphProps> {
  return (COMPONENT_TYPES.find((componentTypeData) => componentTypeData.id === typeId) ?? COMPONENT_TYPES[0]).icon;
}

/**
 * Creates an SVG with a color and glyph based on the type of component.
 */
export function ComponentIconGlyph(props: ComponentIconGlyphProps): JSX.Element {
  const { typeId, ...forwardProps } = props;

  // The order of the props is important so that they can be overwritten by forwardProps
  return <Icon label={capitalize(typeId)} glyph={getComponentTypeIdData(typeId)} {...forwardProps} />;
}

export function ServiceIcon(props: GlyphProps): JSX.Element {
  return (
    <Icon glyph={COMPONENT_TYPES.find((componentTypeData) => componentTypeData.id === 'SERVICE')?.icon} {...props} />
  );
}
