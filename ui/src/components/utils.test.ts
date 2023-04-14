import { capitalizeAndReplaceUnderscoresWithSpaces } from './utils';

describe('utils', () => {
  it('Capitalize: capitalize lowercase text', async () => {
    expect(capitalizeAndReplaceUnderscoresWithSpaces('test')).toBe('Test');
  });

  it('Capitalize: capitalize uppercase text', async () => {
    expect(capitalizeAndReplaceUnderscoresWithSpaces('TEST')).toBe('Test');
  });

  it('Capitalize: replace _ with a <-SPACE->', async () => {
    expect(capitalizeAndReplaceUnderscoresWithSpaces('MACHINE_LEARNING_MODEL')).toBe('Machine learning model');
  });

  it('Capitalize: empty string', async () => {
    expect(capitalizeAndReplaceUnderscoresWithSpaces('')).toBe('');
  });
});
