import { TEAMS_AMOUNT } from '../constants';

export function getTeamsQuery(organizationId: string, siteId: string, accountId?: string, searchValue?: string) {
  const memberIds = accountId ? [accountId] : [];
  const query = searchValue ?? '';

  const sortBy = [
    {
      field: 'DISPLAY_NAME',
      order: 'ASC',
    },
    {
      field: 'STATE',
      order: 'ASC',
    },
  ];

  return {
    name: 'teams',
    query: `
    query teamSearchV2 ($organizationId: ID!, $siteId: String!, $memberIds: [ID] = [], $sortBy: [TeamSort], $first: Int, $query: String!) {
        team {
        teamSearchV2 (organizationId: $organizationId, siteId: $siteId, filter: { query: $query, membership: {memberIds: $memberIds}}, sortBy: $sortBy, first: $first) @optIn(to: "Team-search-v2") {
          nodes {
            team {
              id
              displayName
              smallAvatarImageUrl
              state
            }
          }
        }
      }
        
    }
      `,
    variables: {
      organizationId,
      siteId,
      sortBy,
      memberIds,
      query,
      first: TEAMS_AMOUNT,
    },
  };
}
