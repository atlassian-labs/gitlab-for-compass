import { FunctionComponent } from 'react';
import debounce from 'lodash.debounce';

import TextField from '@atlaskit/textfield';
import EditorSearchIcon from '@atlaskit/icon/glyph/editor/search';

const MAX_INPUT_LENGTH = 2000;

type Props = {
  handleSearchValue: (searchValue: string) => void;
  isProjectsLoading: boolean;
};

const DELAY = 1000;

export const Search: FunctionComponent<Props> = ({ handleSearchValue, isProjectsLoading }: Props) => {
  const debounceSearchValue = debounce(handleSearchValue, DELAY);

  return (
    <TextField
      isDisabled={isProjectsLoading}
      elemAfterInput={<EditorSearchIcon label='Search by name' />}
      autoComplete='off'
      spellCheck={false}
      maxLength={MAX_INPUT_LENGTH}
      placeholder='Search...'
      id='search-by-name-filter'
      onChange={(e) => debounceSearchValue(e.currentTarget.value)}
    />
  );
};
