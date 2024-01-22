import { DEFAULT_SERVER_ERROR_MESSAGE } from '../models/error-messages';

export const aggResponseErrorHandler = (responseBody: any) => {
  const { data, errors } = responseBody;
  if (errors) {
    console.error('AGG error returned', errors);
    throw new Error(DEFAULT_SERVER_ERROR_MESSAGE);
  }
  return data;
};
