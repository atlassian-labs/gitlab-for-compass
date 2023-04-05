// Omit the label and the include it back in as an optional field
// Omit glyph entirely
import { CustomGlyphProps, IconProps } from '@atlaskit/icon';
import { FunctionComponent } from 'react';

export type CompassIconsProps = Omit<IconProps, 'label' | 'glyph'> & Partial<Pick<IconProps, 'label'>>;

export type ComponentTypeData = {
  id: string;
  label: string;
  color: string;
  icon: FunctionComponent<CustomGlyphProps>;
  fieldDefinitionIds: Array<string>;
};
