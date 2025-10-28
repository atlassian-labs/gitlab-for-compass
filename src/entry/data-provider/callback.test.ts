import { callback } from './callback';
import { serverResponse } from '../../utils/webtrigger-utils';

jest.mock('../../utils/webtrigger-utils', () => ({
  serverResponse: jest.fn((msg) => `mocked: ${msg}`),
}));

describe('callback', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('logs error and returns server response when success is false', () => {
    const input = { success: false, url: '', errorMessage: 'Something went wrong' };
    const result = callback(input);

    expect(console.error).toHaveBeenCalledWith({
      message: 'Error processing dataProvider module',
      errorMessage: 'Something went wrong',
    });
    expect(serverResponse).toHaveBeenCalledWith('Callback finished');
    expect(result).toBe('mocked: Callback finished');
  });

  it('does not log error and returns server response when success is true', () => {
    const input = { success: true, url: '' };
    const result = callback(input);

    expect(console.error).not.toHaveBeenCalled();
    expect(serverResponse).toHaveBeenCalledWith('Callback finished');
    expect(result).toBe('mocked: Callback finished');
  });
});
