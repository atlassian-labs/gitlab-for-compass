import Resolver from '@forge/resolver';
import graphqlGateway, { CompassEventType } from '@atlassian/forge-graphql';

const resolver = new Resolver();
type ReqPayload = {
  cloudId: string;
};

resolver.define('dataProviderBackfill', async (req) => {
  const { cloudId } = req.payload as ReqPayload;
  console.log({
    message: 'BACKFILL: dataProviderBackfill queue invocation',
    cloudId,
  });

  // call sync link associations
  const result = await graphqlGateway.compass.asApp().synchronizeLinkAssociations({
    cloudId,
    forgeAppId: process.env.FORGE_APP_ID,
    options: {
      eventTypes: [CompassEventType.Push],
    },
  });

  if (result.success) {
    console.log('BACKFILL: synchronize link associations success');
  } else {
    console.error('BACKFILL: synchronize link associations failure', result.errors);
  }
});

export default resolver.getDefinitions();
