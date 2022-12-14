import { CompassCreateEventInput } from '@atlassian/forge-graphql';
import { sendEvents } from '../client/compass';

export const sendEventToCompass = async (payload: CompassCreateEventInput): Promise<void> => {
  try {
    await sendEvents(payload);
  } catch (e) {
    console.error(`Error sending event to Compass`, e);
  }
};
