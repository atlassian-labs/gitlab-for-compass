import { transformRelationshipsFromYamlConfig, transformFieldsFromYamlConfig } from './yaml-config-transforms';

describe('transformRelationshipsFromYamlConfig', () => {
  it('returns empty array if relationships is null or undefined', () => {
    expect(transformRelationshipsFromYamlConfig(null as any)).toEqual([]);
    expect(transformRelationshipsFromYamlConfig(undefined as any)).toEqual([]);
  });

  it('returns empty array if relationships is an empty object', () => {
    expect(transformRelationshipsFromYamlConfig({} as any)).toEqual([]);
  });

  it('transforms a single relationship type with multiple nodeIds', () => {
    const input = {
      dependsOn: ['id1', 'id2'],
    };
    expect(transformRelationshipsFromYamlConfig(input as any)).toEqual([
      { nodeId: 'id1', type: 'dependsOn' },
      { nodeId: 'id2', type: 'dependsOn' },
    ]);
  });

  it('transforms multiple relationship types', () => {
    const input = {
      dependsOn: ['id1'],
      relatedTo: ['id2', 'id3'],
    };
    expect(transformRelationshipsFromYamlConfig(input as any)).toEqual([
      { nodeId: 'id1', type: 'dependsOn' },
      { nodeId: 'id2', type: 'relatedTo' },
      { nodeId: 'id3', type: 'relatedTo' },
    ]);
  });

  it('handles non-string nodeIds', () => {
    const input = {
      dependsOn: [123, null, undefined],
    };
    expect(transformRelationshipsFromYamlConfig(input as any)).toEqual([
      { nodeId: 123, type: 'dependsOn' },
      { nodeId: null, type: 'dependsOn' },
      { nodeId: undefined, type: 'dependsOn' },
    ]);
  });
});

describe('transformFieldsFromYamlConfig', () => {
  it('returns null if fields is null, undefined, or empty object', () => {
    expect(transformFieldsFromYamlConfig(null as any)).toBeNull();
    expect(transformFieldsFromYamlConfig(undefined as any)).toBeNull();
    expect(transformFieldsFromYamlConfig({} as any)).toBeNull();
  });

  it('transforms fields with string values', () => {
    const input = { foo: 'bar', baz: 'qux' };
    expect(transformFieldsFromYamlConfig(input as any)).toEqual({
      foo: ['bar'],
      baz: ['qux'],
    });
  });

  it('transforms fields with number values', () => {
    const input = { foo: 123, bar: 0 };
    expect(transformFieldsFromYamlConfig(input as any)).toEqual({
      foo: ['123'],
      bar: ['0'],
    });
  });

  it('handles objects as values (calls toString)', () => {
    const obj = { toString: () => 'custom' };
    const input = { foo: obj };
    expect(transformFieldsFromYamlConfig(input as any)).toEqual({
      foo: ['custom'],
    });
  });
});
