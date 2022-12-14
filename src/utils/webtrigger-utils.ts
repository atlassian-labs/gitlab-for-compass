import { WebtriggerResponse } from '../types';

export const serverResponse = (
  message: string,
  // eslint-disable-next-line default-param-last
  statusCode = 200,
  parameters?: Record<string, unknown>,
): WebtriggerResponse => {
  const body = JSON.stringify({
    message,
    success: statusCode >= 200 && statusCode < 300,
    ...(parameters !== undefined && { parameters }),
  });
  const defaultHeaders = {
    'Content-Type': ['application/json'],
  };

  return {
    body,
    statusCode,
    headers: defaultHeaders,
  };
};
