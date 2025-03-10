import { CompassCreateEventInput } from '@atlassian/forge-graphql';
import { sendEvents } from '../client/compass';
import { PushEvent } from '../types';

export const sendEventToCompass = async (
  payload: CompassCreateEventInput | CompassCreateEventInput[],
): Promise<void> => {
  try {
    await sendEvents(payload);
  } catch (e) {
    console.error(`Error sending event to Compass`, e);
  }
};

function gitlabCommitToCompassEvent(
  change: PushEvent['commits'][number],
  pushEvent: PushEvent,
  cloudId: string,
): CompassCreateEventInput {
  try {
    const branchName = pushEvent.ref.replace(/^refs\/heads\//, '');

    return {
      cloudId,
      event: {
        push: {
          pushEventProperties: {
            id: change.id,
            branchName,
            author: {
              name: change.author.name,
              email: change.author.email,
            },
          },
          externalEventSourceId: pushEvent.project.id.toString(),
          updateSequenceNumber: 1,
          displayName: `Commit on branch ${branchName}`,
          url: change.url,
          description: change.message,
          lastUpdated: change.timestamp,
        },
      },
    };
  } catch (e) {
    console.error('Error parsing Gitlab push payload', e);
    throw new Error();
  }
}

export const sendPushEventToCompass = async (pushEvent: PushEvent, cloudId: string): Promise<void> => {
  const startTime = Date.now();

  console.log({
    message: 'Sending pushes to compass',
    pushCount: pushEvent.commits.length,
    cloudId,
  });

  const events = pushEvent.commits.map((commit) => {
    return gitlabCommitToCompassEvent(commit, pushEvent, cloudId);
  });

  if (events.length < 1) {
    console.log({ message: 'No valid push events to send to Compass' });
    return;
  }

  await sendEventToCompass(events);
  console.log({
    message: 'Push Event Web trigger finished',
    duration: Date.now() - startTime,
  });
};
