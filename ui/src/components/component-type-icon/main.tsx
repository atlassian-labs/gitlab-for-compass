import { CompassComponentTypeObject } from '@atlassian/forge-graphql';

export const ComponentTypeIcon = (props: Pick<CompassComponentTypeObject, 'name' | 'iconUrl'>) => {
  const { name, iconUrl } = props;

  return iconUrl ? <img src={iconUrl} alt={name ?? ''} width={24} height={24} /> : null;
};
