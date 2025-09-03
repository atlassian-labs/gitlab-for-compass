/* eslint-disable no-console */
export const debugLog = (message?: any, ...optionalParams: any[]) => {
  console.log(process.env.APP_ENV);
  if (process.env.APP_ENV !== 'production') {
    console.log(message, ...optionalParams); // Log only in non-production env
  }
};
