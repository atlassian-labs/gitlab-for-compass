import { capitalize } from './utils';

describe('utils', () => {
  it('Capitalize: capitalize lowercase text', async () => {
    expect(capitalize('test')).toBe('Test');
  });

  it('Capitalize: capitalize uppercase text', async () => {
    expect(capitalize('TEST')).toBe('Test');
  });
});
