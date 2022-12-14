// Omit the label and the include it back in as an optional field
// Omit glyph entirely
import { IconProps } from '@atlaskit/icon';

export type CompassIconsProps = Omit<IconProps, 'label' | 'glyph'> & Partial<Pick<IconProps, 'label'>>;
