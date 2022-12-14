import { DAYS_TO_CALC, MILLISEC_IN_DAY } from '../constants';

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const getDateInThePast = (daysToCalc = DAYS_TO_CALC) =>
  new Date(Date.now() - daysToCalc * MILLISEC_IN_DAY).toISOString();
