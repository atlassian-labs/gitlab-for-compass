import Resolver from '@forge/resolver';
import graphqlGateway, { CompassEventType } from '@atlassian/forge-graphql';
import { storage } from '@forge/api';
import { STORAGE_KEYS } from '../constants';
import { CURRENT_BACKFILL_VERSION } from '../entry/scheduled-triggers/data-provider-backfill';

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
    await storage.set(STORAGE_KEYS.BACKFILL_PUSH_DATA_PROVIDER_VERSION, CURRENT_BACKFILL_VERSION);
    console.log('BACKFILL: synchronize link associations success');
  } else {
    console.error('BACKFILL: synchronize link associations failure', result.errors);
  }
});

export default resolver.getDefinitions();
