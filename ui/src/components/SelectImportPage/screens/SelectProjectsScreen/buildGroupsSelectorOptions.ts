import { OptionType } from '@atlaskit/select';

import { GitlabAPIGroup } from '../../../../types';

export interface SelectorItem extends OptionType {
  label: string;
  value: number;
}

export const buildGroupsSelectorOptions = (groups: GitlabAPIGroup[], locationGroupId: number): SelectorItem[] => {
  const selectorItems: { [key: string]: SelectorItem } = {};

  const filteredGroups = groups.filter(({ id }) => id !== locationGroupId);

  filteredGroups.forEach(({ name, id }) => {
    selectorItems[id] = {
      label: name,
      value: id,
    };
  });

  return Object.values(selectorItems);
};
