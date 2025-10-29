export function getTenantContextQuery(cloudId: string) {
  return {
    name: 'tenantContext',
    query: `
      query tenantContext($cloudId: ID!) {
          tenantContexts(cloudIds: [$cloudId]) {
                  orgId
          }
      }
      `,
    variables: {
      cloudId,
    },
  };
}
