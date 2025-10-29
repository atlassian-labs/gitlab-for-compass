import { CustomFieldType } from '@atlassian/forge-graphql-types';
import {
  isCompassCustomTextField,
  isCompassCustomNumberField,
  isCompassCustomBooleanField,
  isCompassCustomUserField,
  isCompassCustomSingleSelectField,
  isCompassCustomMultiSelectField,
  formatCustomFieldsToYamlFormat,
} from './format-custom-fields-to-yaml';

describe('Custom field type guards', () => {
  it('isCompassCustomTextField returns true for textValue', () => {
    expect(isCompassCustomTextField({ textValue: 'abc' })).toBe(true);
    expect(isCompassCustomTextField({})).toBe(false);
  });

  it('isCompassCustomNumberField returns true for numberValue', () => {
    expect(isCompassCustomNumberField({ numberValue: 42 })).toBe(true);
    expect(isCompassCustomNumberField({})).toBe(false);
  });

  it('isCompassCustomBooleanField returns true for booleanValue', () => {
    expect(isCompassCustomBooleanField({ booleanValue: true })).toBe(true);
    expect(isCompassCustomBooleanField({})).toBe(false);
  });

  it('isCompassCustomUserField returns true for userIdValue', () => {
    expect(isCompassCustomUserField({ userIdValue: 'user-1' })).toBe(true);
    expect(isCompassCustomUserField({})).toBe(false);
  });

  it('isCompassCustomSingleSelectField returns true for option', () => {
    expect(isCompassCustomSingleSelectField({ option: { id: 'opt-1', value: '' } })).toBe(true);
    expect(isCompassCustomSingleSelectField({})).toBe(false);
  });

  it('isCompassCustomMultiSelectField returns true for options', () => {
    expect(isCompassCustomMultiSelectField({ options: [{ id: 'opt-1', value: '' }] })).toBe(true);
    expect(isCompassCustomMultiSelectField({})).toBe(false);
  });
});

describe('formatCustomFieldsToYamlFormat', () => {
  const def = (name: string) => ({ definition: { name, id: '1' } });

  it('returns null for empty or undefined input', () => {
    expect(formatCustomFieldsToYamlFormat(undefined)).toBeNull();
    expect(formatCustomFieldsToYamlFormat([])).toBeNull();
  });

  it('formats text field', () => {
    const fields = [{ ...def('Text'), textValue: 'abc' }];
    expect(formatCustomFieldsToYamlFormat(fields)).toEqual([
      { name: 'Text', type: CustomFieldType.TEXT, value: 'abc' },
    ]);
  });

  it('formats boolean field', () => {
    const fields = [{ ...def('Bool'), booleanValue: true }];
    expect(formatCustomFieldsToYamlFormat(fields)).toEqual([
      { name: 'Bool', type: CustomFieldType.BOOLEAN, value: true },
    ]);
  });

  it('formats number field', () => {
    const fields = [{ ...def('Num'), numberValue: 123 }];
    expect(formatCustomFieldsToYamlFormat(fields)).toEqual([{ name: 'Num', type: CustomFieldType.NUMBER, value: 123 }]);
  });

  it('formats user field', () => {
    const fields = [{ ...def('User'), userIdValue: 'user-123' }];
    expect(formatCustomFieldsToYamlFormat(fields)).toEqual([
      { name: 'User', type: CustomFieldType.USER, value: 'user-123' },
    ]);
  });

  it('formats single select field', () => {
    const fields = [{ ...def('Single'), option: { id: 'opt-1' } }];
    expect(formatCustomFieldsToYamlFormat(fields)).toEqual([
      { name: 'Single', type: CustomFieldType.SINGLE_SELECT, value: 'opt-1' },
    ]);
  });

  it('formats multi select field', () => {
    const fields = [{ ...def('Multi'), options: [{ id: 'opt-1' }, { id: 'opt-2' }] }];
    expect(formatCustomFieldsToYamlFormat(fields)).toEqual([
      { name: 'Multi', type: CustomFieldType.MULTI_SELECT, value: ['opt-1', 'opt-2'] },
    ]);
  });

  it('ignores unknown field types', () => {
    const fields = [{ ...def('Unknown'), foo: 'bar' }];
    expect(formatCustomFieldsToYamlFormat(fields)).toEqual([]);
  });

  it('handles a mix of all types', () => {
    const fields = [
      { ...def('Text'), textValue: 'abc' },
      { ...def('Bool'), booleanValue: true },
      { ...def('Num'), numberValue: 123 },
      { ...def('User'), userIdValue: 'user-123' },
      { ...def('Single'), option: { id: 'opt-1' } },
      { ...def('Multi'), options: [{ id: 'opt-1' }, { id: 'opt-2' }] },
      { ...def('Unknown'), foo: 'bar' },
    ];
    expect(formatCustomFieldsToYamlFormat(fields)).toEqual([
      { name: 'Text', type: CustomFieldType.TEXT, value: 'abc' },
      { name: 'Bool', type: CustomFieldType.BOOLEAN, value: true },
      { name: 'Num', type: CustomFieldType.NUMBER, value: 123 },
      { name: 'User', type: CustomFieldType.USER, value: 'user-123' },
      { name: 'Single', type: CustomFieldType.SINGLE_SELECT, value: 'opt-1' },
      { name: 'Multi', type: CustomFieldType.MULTI_SELECT, value: ['opt-1', 'opt-2'] },
    ]);
  });
});
