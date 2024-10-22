import { hasRejections, getFormattedErrors, ALL_SETTLED_STATUS } from './promise-allsettled-helpers';

describe('hasRejections', () => {
  it('should return false when the provided array is empty', () => {
    const results: PromiseSettledResult<unknown>[] = [];
    expect(hasRejections(results)).toBe(false);
  });

  it('should return true when the provided array has a single rejected promise', () => {
    const results: PromiseSettledResult<unknown>[] = [{ status: ALL_SETTLED_STATUS.REJECTED, reason: 'error' }];
    expect(hasRejections(results)).toBe(true);
  });

  it('should return false when the provided array has a single fulfilled promise', () => {
    const results: PromiseSettledResult<unknown>[] = [{ status: ALL_SETTLED_STATUS.FULFILLED, value: 'success' }];
    expect(hasRejections(results)).toBe(false);
  });

  it('should return false when the provided array has all successful promises', () => {
    const results: PromiseSettledResult<unknown>[] = [
      { status: ALL_SETTLED_STATUS.FULFILLED, value: 'success1' },
      { status: ALL_SETTLED_STATUS.FULFILLED, value: 'success2' },
      { status: ALL_SETTLED_STATUS.FULFILLED, value: 'success3' },
    ];
    expect(hasRejections(results)).toBe(false);
  });

  it('should return true when the provided array has all rejected promises', () => {
    const results: PromiseSettledResult<unknown>[] = [
      { status: ALL_SETTLED_STATUS.REJECTED, reason: 'error1' },
      { status: ALL_SETTLED_STATUS.REJECTED, reason: 'error2' },
      { status: ALL_SETTLED_STATUS.REJECTED, reason: 'error3' },
    ];
    expect(hasRejections(results)).toBe(true);
  });

  it('should return true when the provided array has mixed fulfilled and rejected promises', () => {
    const results: PromiseSettledResult<unknown>[] = [
      { status: ALL_SETTLED_STATUS.REJECTED, reason: 'error1' },
      { status: ALL_SETTLED_STATUS.FULFILLED, value: 'success1' },
      { status: ALL_SETTLED_STATUS.REJECTED, reason: 'error2' },
      { status: ALL_SETTLED_STATUS.FULFILLED, value: 'success2' },
    ];
    expect(hasRejections(results)).toBe(true);
  });
});

describe('getFormattedErrors', () => {
  it('should return an empty string when no promise results are given', () => {
    const results: PromiseSettledResult<unknown>[] = [];
    expect(getFormattedErrors(results)).toBe('');
  });

  it('should return an empty string when a single successful result is given', () => {
    const results: PromiseSettledResult<unknown>[] = [{ status: ALL_SETTLED_STATUS.FULFILLED, value: 'success' }];
    expect(getFormattedErrors(results)).toBe('');
  });

  it('should return the error message when a single error result is given', () => {
    const results: PromiseSettledResult<unknown>[] = [{ status: ALL_SETTLED_STATUS.REJECTED, reason: 'error' }];
    expect(getFormattedErrors(results)).toBe('1.) error');
  });

  it('should handle rejected promise with an empty error message', () => {
    const results: PromiseSettledResult<unknown>[] = [{ status: ALL_SETTLED_STATUS.REJECTED, reason: '' }];
    expect(getFormattedErrors(results)).toBe('1.) ');
  });

  it('should return all error messages when multiple rejected promises are given', () => {
    const results: PromiseSettledResult<unknown>[] = [
      { status: ALL_SETTLED_STATUS.REJECTED, reason: 'error1' },
      { status: ALL_SETTLED_STATUS.REJECTED, reason: 'error2' },
      { status: ALL_SETTLED_STATUS.REJECTED, reason: 'error3' },
    ];
    expect(getFormattedErrors(results)).toBe('1.) error1, 2.) error2, 3.) error3');
  });

  // eslint-disable-next-line max-len
  it('should return all error messages in the expected format when an array of successful and rejected promises is given', () => {
    const results: PromiseSettledResult<unknown>[] = [
      { status: ALL_SETTLED_STATUS.FULFILLED, value: 'success1' },
      { status: ALL_SETTLED_STATUS.REJECTED, reason: 'error1' },
      { status: ALL_SETTLED_STATUS.FULFILLED, value: 'success2' },
      { status: ALL_SETTLED_STATUS.REJECTED, reason: 'error2' },
    ];
    expect(getFormattedErrors(results)).toBe('1.) error1, 2.) error2');
  });
});
