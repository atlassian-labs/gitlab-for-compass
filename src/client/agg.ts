import api from '@forge/api';
import { aggResponseErrorHandler } from './agg-response-error-handler';
import { AggOperation } from '../types';

export const aggQuery = async (request: AggOperation) => {
  const response = await api.asApp().requestGraph(request.query, request.variables);
  const responseBody = await response.json();
  console.log({
    message: 'AGG request',
    requestName: request.name,
    responseStatus: response.status,
    requestId: responseBody?.extensions?.gateway?.request_id,
  });
  return aggResponseErrorHandler(responseBody);
};
