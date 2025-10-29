import { aggResponseErrorHandler } from './agg-response-error-handler';
import { DEFAULT_SERVER_ERROR_MESSAGE } from '../models/error-messages';

describe('aggResponseErrorHandler', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('returns data when there are no errors', () => {
    const data = { foo: 'bar' };
    const responseBody = { data };
    expect(aggResponseErrorHandler(responseBody)).toBe(data);
  });

  it('logs and throws when errors are present', () => {
    const errors = [{ message: 'Something went wrong' }];
    const responseBody = { data: {}, errors };

    expect(() => aggResponseErrorHandler(responseBody)).toThrow(DEFAULT_SERVER_ERROR_MESSAGE);
    expect(console.error).toHaveBeenCalledWith('AGG error returned', errors);
  });
});
