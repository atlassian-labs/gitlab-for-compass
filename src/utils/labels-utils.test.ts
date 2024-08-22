import { IMPORT_LABEL } from '../constants';
import { formatLabels, mergeLabels } from './labels-utils';

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

describe('mergeLabels', () => {
  it('should return an array with IMPORT_LABEL when both projectLabels and currentLabels are empty', () => {
    const result = mergeLabels([], []);
    expect(result).toEqual([IMPORT_LABEL]);
  });

  it('should return formatted projectLabels with IMPORT_LABEL when currentLabels is empty', () => {
    const projectLabels = ['Label1', 'Label2'];
    const result = mergeLabels(projectLabels, []);
    expect(result).toEqual([IMPORT_LABEL, 'label1', 'label2']);
  });

  it('should return formatted currentLabels with IMPORT_LABEL when projectLabels is empty', () => {
    const currentLabels = ['label2', 'label3'];
    const result = mergeLabels([], currentLabels);
    expect(result).toEqual([IMPORT_LABEL, 'label2', 'label3']);
  });

  it('should merge and deduplicate labels from projectLabels and currentLabels, including IMPORT_LABEL', () => {
    const projectLabels = ['Label1', 'Label2'];
    const currentLabels = ['label2', 'label3'];
    const result = mergeLabels(projectLabels, currentLabels);
    expect(result).toEqual([IMPORT_LABEL, 'label1', 'label2', 'label3']);
  });

  it('should return up to 20 labels including IMPORT_LABEL', () => {
    const projectLabels = Array.from({ length: 15 }, (_, i) => `Label${i + 1}`);
    const currentLabels = Array.from({ length: 10 }, (_, i) => `label${i + 16}`);
    const result = mergeLabels(projectLabels, currentLabels);
    expect(result.length).toBe(20);
    expect(result).toContain(IMPORT_LABEL);
  });

  it('should include IMPORT_LABEL if not present in the combined labels', () => {
    const projectLabels = ['Label1', 'Label2'];
    const currentLabels = ['label3', 'label4'];
    const result = mergeLabels(projectLabels, currentLabels);
    expect(result).toContain(IMPORT_LABEL);
  });

  it('should not duplicate IMPORT_LABEL if it is already present', () => {
    const projectLabels = ['Label1', 'Label2'];
    const currentLabels = ['label3', IMPORT_LABEL];
    const result = mergeLabels(projectLabels, currentLabels);
    expect(result.filter((label) => label === IMPORT_LABEL).length).toBe(1);
  });
});
