import { RowType } from '@atlaskit/dynamic-table/dist/types/types';
import Tooltip from '@atlaskit/tooltip';
import { ImportableProject } from '../../types';

import { ForgeLink } from '../ForgeLink';
import { TruncateDescription } from '../styles';
import { NameWrapper } from './styles';

type Props = {
  failedProjects: ImportableProject[];
};

export const buildRows = ({ failedProjects }: Props): RowType[] =>
  failedProjects.map(({ id, name, description, url }) => {
    return {
      key: `${id}`,
      cells: [
        {
          key: 'name',
          content: (
            <NameWrapper>
              <ForgeLink to={url} openInNewTab>
                {name}
              </ForgeLink>
            </NameWrapper>
          ),
        },
        {
          key: 'description',
          content: (
            <Tooltip content={description || '-'} position='left-start'>
              <TruncateDescription maxWidth='700'>{description || '-'}</TruncateDescription>
            </Tooltip>
          ),
        },
      ],
    };
  });
