import { formatLabels } from './format-labels';

describe('formatLabels', () => {
  it('should format labels correctly', () => {
    const input = ['Example Label', 'AnotherExampleLabelThatIsWayTooLongAndShouldBeTruncated'];
    const expectedOutput = ['example-label', 'anotherexamplelabelthatiswaytoolongandsh'];

    const result = formatLabels(input);

    expect(result).toEqual(expectedOutput);
  });

  it('should handle empty array', () => {
    const input: string[] = [];
    const expectedOutput: string[] = [];

    const result = formatLabels(input);

    expect(result).toEqual(expectedOutput);
  });

  it('should not alter labels shorter than 40 characters', () => {
    const input = ['short', 'medium length label'];
    const expectedOutput = ['short', 'medium-length-label'];

    const result = formatLabels(input);

    expect(result).toEqual(expectedOutput);
  });

  it('should convert spaces to hyphens and lowercase all characters', () => {
    const input = ['Mixed CASE Label', 'Label With Spaces'];
    const expectedOutput = ['mixed-case-label', 'label-with-spaces'];

    const result = formatLabels(input);

    expect(result).toEqual(expectedOutput);
  });
});
