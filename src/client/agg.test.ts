/* eslint-disable no-console */
import api from '@forge/api';
import { aggQuery } from './agg';
import { aggResponseErrorHandler } from './agg-response-error-handler';
import { AggOperation } from '../types';

jest.mock('@forge/api');
jest.mock('./agg-response-error-handler');

describe('aggQuery', () => {
  const mockRequest: AggOperation = {
    query: 'query { foo }',
    name: 'TestQuery',
    variables: { bar: 1 },
  };

  const mockResponseBody = {
    data: { foo: 'bar' },
    extensions: {
      gateway: {
        request_id: 'req-123',
      },
    },
  };

  let originalConsoleLog: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock api.asApp().requestGraph
    (api.asApp as jest.Mock).mockReturnValue({
      requestGraph: jest.fn().mockResolvedValue({
        status: 200,
        json: jest.fn().mockResolvedValue(mockResponseBody),
      }),
    });
    // Mock error handler
    (aggResponseErrorHandler as jest.Mock).mockReturnValue('handler-result');
    // Spy on console.log
    originalConsoleLog = console.log;
    console.log = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  it('calls api.asApp().requestGraph with correct query and variables', async () => {
    await aggQuery(mockRequest);
    expect(api.asApp().requestGraph).toHaveBeenCalledWith(mockRequest.query, mockRequest.variables);
  });

  it('calls aggResponseErrorHandler with the response body and returns its result', async () => {
    const result = await aggQuery(mockRequest);
    expect(aggResponseErrorHandler).toHaveBeenCalledWith(mockResponseBody);
    expect(result).toBe('handler-result');
  });

  it('logs the correct payload', async () => {
    await aggQuery(mockRequest);
    expect(console.log).toHaveBeenCalledWith({
      message: 'AGG request',
      requestName: mockRequest.name,
      responseStatus: 200,
      requestId: 'req-123',
    });
  });

  it('handles missing extensions/gateway/request_id gracefully', async () => {
    (api.asApp as jest.Mock).mockReturnValue({
      requestGraph: jest.fn().mockResolvedValue({
        status: 200,
        json: jest.fn().mockResolvedValue({ data: {}, extensions: {} }),
      }),
    });
    await aggQuery(mockRequest);
    expect(console.log).toHaveBeenCalledWith({
      message: 'AGG request',
      requestName: mockRequest.name,
      responseStatus: 200,
      requestId: undefined,
    });
  });
});
