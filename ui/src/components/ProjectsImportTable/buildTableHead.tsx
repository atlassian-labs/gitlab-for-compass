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
  isOnboardingFlow: boolean;
};

export const buildTableHead = ({
  isLoading,
  onSelectAllItems,
  isAllItemsSelected,
  projects,
  isSpotlightActive,
  finishOnboarding,
  isOnboardingFlow,
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
        width: isOnboardingFlow ? 30 : 10,
        isSortable: false,
      },
      {
        key: 'GROUP_NAME',
        content: 'Group name',
        width: isOnboardingFlow ? 10 : 15,
        isSortable: false,
      },
      ...(!isOnboardingFlow
        ? [
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
          ]
        : [{}]),
      {
        key: 'COMPONENT_TYPE',
        content: 'Component type',
        width: isOnboardingFlow ? 50 : 15,
      },
      ...(!isOnboardingFlow
        ? [
            {
              key: 'OWNER_TEAM',
              content: (
                <SpotlightManager blanketIsTinted={false}>
                  <SpotlightTarget name='teamonboarding'>
                    <OwnerTeamHeadWrapper>Owner team</OwnerTeamHeadWrapper>
                  </SpotlightTarget>
                  <SpotlightTransition>
                    {isSpotlightActive && !isLoading && (
                      <Spotlight
                        actions={[
                          {
                            onClick: finishOnboarding,
                            text: 'Okay',
                          },
                        ]}
                        dialogWidth={315}
                        heading='Select an owner team'
                        target='teamonboarding'
                        key='teamonboarding'
                        dialogPlacement='left top'
                        targetRadius={4}
                        targetBgColor={token('color.icon.inverse', N0)}
                      >
                        Select an owner team for the components you import and meet the criteria for your Service
                        Readiness scorecard.
                      </Spotlight>
                    )}
                  </SpotlightTransition>
                </SpotlightManager>
              ),
              width: 15,
            },
          ]
        : [{}]),
    ],
  };
};
