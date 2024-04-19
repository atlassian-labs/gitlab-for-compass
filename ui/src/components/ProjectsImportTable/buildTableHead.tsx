import Checkbox from '@atlaskit/checkbox';
import { HeadType } from '@atlaskit/dynamic-table/dist/types/types';
import { Spotlight, SpotlightManager, SpotlightTarget, SpotlightTransition } from '@atlaskit/onboarding';
import { N0 } from '@atlaskit/theme/colors';
import { token } from '@atlaskit/tokens';

import { TooltipGenerator } from '../TooltipGenerator';
import { tooltipsText } from '../utils';
import { StatusWrapper } from '../SelectImportPage/styles';
import { ProjectImportSelection } from '../../services/types';
import { OwnerTeamHeadWrapper } from './styles';

type Params = {
  projects: ProjectImportSelection[];
  onSelectAllItems: (filteredProjects: ProjectImportSelection[], isAllItemsSelected: boolean) => void;
  isAllItemsSelected: boolean;
  isLoading: boolean;
  isSpotlightActive: boolean;
  finishOnboarding: () => void;
};

export const buildTableHead = ({
  isLoading,
  onSelectAllItems,
  isAllItemsSelected,
  projects,
  isSpotlightActive,
  finishOnboarding,
}: Params): HeadType => {
  return {
    cells: [
      {
        key: 'CHECKBOX',
        content: (
          <Checkbox
            isDisabled={isLoading || projects.length === 0}
            isChecked={isAllItemsSelected}
            onChange={() => onSelectAllItems(projects, isAllItemsSelected)}
          />
        ),
        width: 5,
        isSortable: false,
      },
      {
        key: 'NAME',
        content: 'Name',
        width: 10,
        isSortable: false,
      },
      {
        key: 'GROUP_NAME',
        content: 'Group name',
        width: 15,
        isSortable: false,
      },
      {
        key: 'DESCRIPTION',
        content: 'Description',
        width: 30,
        isSortable: false,
      },
      {
        key: 'STATUS',
        content: (
          <StatusWrapper>
            <p>Status</p>
            <TooltipGenerator
              title={tooltipsText.statusHeader.title}
              description={tooltipsText.statusHeader.description}
            >
              {tooltipsText.statusHeader.children}
            </TooltipGenerator>
          </StatusWrapper>
        ),
        width: 10,
        isSortable: false,
      },
      {
        key: 'COMPONENT_TYPE',
        content: 'Component type',
        width: 15,
      },
      {
        key: 'OWNER_TEAM',
        content: (
          <SpotlightManager blanketIsTinted={false}>
            <SpotlightTarget name='teamonboarding'>
              <OwnerTeamHeadWrapper>
                <p>Owner team</p>
              </OwnerTeamHeadWrapper>
            </SpotlightTarget>
            <SpotlightTransition>
              {isSpotlightActive && (
                <Spotlight
                  actions={[
                    {
                      onClick: () => finishOnboarding(),
                      text: 'OK',
                    },
                  ]}
                  heading='Select an owner team'
                  target='teamonboarding'
                  key='teamonboarding'
                  targetRadius={3}
                  targetBgColor={token('color.icon.inverse', N0)}
                >
                  Select an owner team for the components you import, and meet the criteria for your Service Readiness
                  scorecard.
                </Spotlight>
              )}
            </SpotlightTransition>
          </SpotlightManager>
        ),
        width: 15,
      },
    ],
  };
};
