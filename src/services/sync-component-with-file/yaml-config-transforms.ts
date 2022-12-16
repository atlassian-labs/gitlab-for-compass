import { YamlFields, YamlRelationships } from '../../types';

export function transformRelationshipsFromYamlConfig(relationships: YamlRelationships): any[] {
  const transformedRelationships: any[] = [];
  if (!relationships) {
    return transformedRelationships;
  }

  for (const relationshipType of Object.keys(relationships)) {
    transformedRelationships.push(
      (relationships as any)[relationshipType].map((nodeId: any) => ({
        nodeId,
        type: relationshipType,
      })),
    );
  }
  return transformedRelationships.flat();
}

export function transformFieldsFromYamlConfig(fields: YamlFields): Record<string, Array<string>> {
  if (!fields || Object.keys(fields).length === 0) {
    return null;
  }

  const outputFields: Record<string, Array<string>> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v != null) {
      outputFields[k] = Array.isArray(v) ? v.map(toString) : [v.toString()];
    }
  }
  return outputFields;
}
