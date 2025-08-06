import { DAYS_TO_CALC, MILLISEC_IN_DAY } from '../constants';

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const getDateInThePast = (daysToCalc = DAYS_TO_CALC) =>
  new Date(Date.now() - daysToCalc * MILLISEC_IN_DAY).toISOString();

export const minutesToMilliseconds = (minutes: number) => {
  const SECONDS_IN_MINUTES = 60;
  const MILLISECONDS_IN_SECOND = 1000;

  return minutes * SECONDS_IN_MINUTES * MILLISECONDS_IN_SECOND;
};

export const getDifferenceBetweenDates = (firstDate: string, secondDate: string) => {
  const DAY_IN_MS = 24 * 60 * 60 * 1000;

  const firstDateInMs = new Date(firstDate).getTime();
  const secondDateInMs = new Date(secondDate).getTime();

  const differenceBtwDates = secondDateInMs - firstDateInMs;

  const daysDiff = Math.round(differenceBtwDates / DAY_IN_MS);

  return daysDiff;
};
