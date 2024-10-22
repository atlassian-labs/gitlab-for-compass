export enum ALL_SETTLED_STATUS {
  FULFILLED = 'fulfilled',
  REJECTED = 'rejected',
}

export const hasRejections = (results: PromiseSettledResult<unknown>[]): boolean => {
  return results.some((result) => result.status === ALL_SETTLED_STATUS.REJECTED);
};

export const getFormattedErrors = (results: PromiseSettledResult<unknown>[]): string => {
  return results
    .filter((result) => result.status === ALL_SETTLED_STATUS.REJECTED)
    .map((result, index) => {
      return `${index + 1}.) ${(result as PromiseRejectedResult).reason}`;
    })
    .join(', ');
};
