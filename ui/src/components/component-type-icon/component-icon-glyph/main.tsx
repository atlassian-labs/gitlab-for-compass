import { ComponentType } from 'react';
import Icon, { CustomGlyphProps } from '@atlaskit/icon';
import { GlyphProps } from '@atlaskit/icon/types';
import { CompassComponentType } from '@atlassian/forge-graphql/dist/src/graphql-types';

import { ApplicationGlyph, CompassIconsProps, LibraryGlyph, OtherGlyph, ServiceGlyph } from '../../assets';
import { capitalize } from '../../utils';

export type ComponentIconGlyphProps = CompassIconsProps & {
  type: CompassComponentType;
};

function getComponentTypeGlyph(type: CompassComponentType): ComponentType<CustomGlyphProps> {
  switch (type) {
    case CompassComponentType.Application:
      return ApplicationGlyph;
    case CompassComponentType.Library:
      return LibraryGlyph;
    case CompassComponentType.Service:
      return ServiceGlyph;
    case CompassComponentType.Other:
      return OtherGlyph;
    default:
      throw Error(`No glyph has been defined for component type "${type}"`);
  }
}

/**
 * Creates an SVG with a color and glyph based on the type of component.
 */
export function ComponentIconGlyph(props: ComponentIconGlyphProps): JSX.Element {
  const { type, ...forwardProps } = props;

  // The order of the props is important so that they can be overwritten by forwardProps
  return <Icon label={capitalize(type)} glyph={getComponentTypeGlyph(type)} {...forwardProps} />;
}

export function ServiceIcon(props: GlyphProps): JSX.Element {
  return <Icon glyph={ServiceGlyph} {...props} />;
}
