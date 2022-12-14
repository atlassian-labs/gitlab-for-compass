import { MergeRequest } from '../../types';

const MILLIS_PER_MIN = 60000;

const calculateCycleTimeForMr = (mergeRequest: MergeRequest): number => {
  const { created_at: createdAt, merged_at: mergedAt } = mergeRequest;

  if (!createdAt || !mergedAt) {
    console.error('No merge request created on or merge time found.');

    return undefined;
  }

  const timeOpenedInMs = Date.parse(createdAt);
  const timeMergedInMs = Date.parse(mergedAt);
  const cycleTimeInMs = timeMergedInMs - timeOpenedInMs;
  const cycleTimeInMins = cycleTimeInMs / MILLIS_PER_MIN;
  return cycleTimeInMins;
};

const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

export const mergeRequestCycleTime = (mergeRequests: MergeRequest[]): number | null => {
  const cycleTimes = mergeRequests.map((mergeRequest) => calculateCycleTimeForMr(mergeRequest)).filter(isDefined);
  const average = cycleTimes.length ? cycleTimes.reduce((acc, cycleTime) => acc + cycleTime, 0) / cycleTimes.length : 0;

  return Math.ceil(average) || 0;
};
