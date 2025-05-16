import { CompassComponentTypeObject } from '@atlassian/forge-graphql-types';

export const ComponentTypeIcon = (props: Pick<CompassComponentTypeObject, 'iconUrl'>) => {
  const { iconUrl } = props;

  return iconUrl ? <img src={iconUrl} alt={''} width={24} height={24} /> : null;
};
