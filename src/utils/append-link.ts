import { CompassLinkType } from '@atlassian/forge-graphql-types';

import { MAX_LINKS_OF_TYPE } from '../constants';
import { YamlLink } from '../types';

export const appendLink = (requiredLink: string, configLinks: YamlLink[] = []): YamlLink[] => {
  if (configLinks.filter((link) => link.type === CompassLinkType.Repository).length >= MAX_LINKS_OF_TYPE) {
    return configLinks;
  }

  const found = configLinks?.some((configLink) => configLink.url.includes(requiredLink));

  if (!found) {
    return [
      ...configLinks,
      {
        type: CompassLinkType.Repository,
        url: requiredLink,
      },
    ];
  }

  return configLinks;
};
