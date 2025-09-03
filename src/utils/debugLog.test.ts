import { debugLog } from './debugLog';

describe('debugLog', () => {
  const { log } = console; // save original console.log function
  beforeEach(() => {
    // eslint-disable-next-line no-console
    console.log = jest.fn(); // create a new mock function for each test
  });
  afterAll(() => {
    // eslint-disable-next-line no-console
    console.log = log; // restore original console.log after all tests
  });

  it('should return console.log for non-production app', () => {
    process.env.APP_ENV = 'development';

    debugLog('test');

    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenCalledWith('test');
  });

  it('should not return console.log for production app', () => {
    process.env.APP_ENV = 'production';
    debugLog('test');

    // eslint-disable-next-line no-console
    expect(console.log).not.toHaveBeenCalledWith('test');
  });
});
