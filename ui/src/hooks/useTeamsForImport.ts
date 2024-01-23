import { useEffect, useState } from 'react';
import { getFirstPageOfTeamsWithMembershipStatus } from '../services/invokes';
import { TeamsWithMembershipStatus } from '../types';
import { DefaultErrorTypes, ErrorTypes } from '../resolverTypes';

export type TeamsForImportResult = {
  isTeamsDataLoading: boolean;
  error: ErrorTypes | undefined;
  teams: TeamsWithMembershipStatus | undefined;
};

export const useTeamsForImport = (): TeamsForImportResult => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ErrorTypes>();
  const [teams, setTeams] = useState<TeamsWithMembershipStatus>();

  useEffect(() => {
    setLoading(true);
    getFirstPageOfTeamsWithMembershipStatus()
      .then((response) => {
        const { success, data, errors } = response;
        if (success && data) {
          setTeams(data.teams);
        } else if (errors?.length) {
          setError(errors[0].errorType || DefaultErrorTypes.UNEXPECTED_ERROR);
        }
      })
      .catch((e) => {
        setError(e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return {
    isTeamsDataLoading: loading,
    error,
    teams,
  };
};
