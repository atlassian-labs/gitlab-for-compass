import { CreateLinkInput } from '@atlassian/forge-graphql';
import Resolver from '@forge/resolver';
import { storage } from '@forge/api';
import { backOff, IBackOffOptions } from 'exponential-backoff';
import { internalMetrics } from '@forge/metrics';

import { createComponent, updateComponent } from './client/compass';
import { STORAGE_KEYS, BACK_OFF, IMPORT_LABEL } from './constants';
import { appendLink } from './utils/append-link';
import { ImportableProject } from './resolverTypes';
import { sleep } from './utils/time-utils';
import { createMRWithCompassYML } from './services/create-mr-with-compass-yml';

const backOffConfig: Partial<IBackOffOptions> = {
  startingDelay: BACK_OFF.startingDelay,
  timeMultiple: BACK_OFF.timeMultiple,
  numOfAttempts: BACK_OFF.numOfAttempts,
  jitter: BACK_OFF.jitter,
};

const resolver = new Resolver();

type ReqPayload = {
  createProjectData: string;
};

const setFailedRepositoriesToStore = async (project: ImportableProject) => {
  try {
    internalMetrics.counter(`compass.gitlab.import.end.fail`).incr();
    await backOff(
      () => storage.set(`${STORAGE_KEYS.CURRENT_IMPORT_FAILED_PROJECT_PREFIX}:${project.id}`, project),
      backOffConfig,
    );
  } catch (err) {
    console.error('Failed to stored failed project after all retries', err);
  }
};

resolver.define('import', async (req) => {
  internalMetrics.counter('compass.gitlab.import.start').incr();

  const { createProjectData } = req.payload as ReqPayload;

  // Added this sleep to add some "jitter", and make progress more user-friendly
  await sleep(Math.ceil(Math.random() * 5000));

  const { cloudId, project, groupId } = JSON.parse(createProjectData);
  const {
    name,
    hasComponent,
    id,
    isCompassFilePrOpened,
    isManaged,
    description,
    type,
    labels,
    url,
    componentLinks,
    componentId,
    shouldOpenMR,
  } = project;

  try {
    if (!hasComponent) {
      const component = await backOff(() => createComponent(cloudId, project), backOffConfig);
      console.log(`GitLab project ${name}:${id} was imported. Compass component was created - ${component.id}.`);

      if (shouldOpenMR) {
        await createMRWithCompassYML(project, component, groupId);
      }
    } else if (hasComponent && !(isCompassFilePrOpened && isManaged)) {
      const formattedLabels = labels.map((label: string) => label.split(' ').join('-').toLowerCase());
      const component = {
        name,
        description,
        type,
        labels: [IMPORT_LABEL, ...formattedLabels],
        links: appendLink(url, componentLinks) as CreateLinkInput[],
      };

      const updatedComponent = await backOff(() => updateComponent({ id: componentId, ...component }), backOffConfig);

      if (shouldOpenMR) {
        await createMRWithCompassYML(project, updatedComponent, groupId);
      }

      if ('err' in updatedComponent) {
        await setFailedRepositoriesToStore(project);
      } else {
        internalMetrics.counter(`compass.gitlab.import.end.success`).incr();
        console.log(
          `GitLab project was imported.
        Compass component - ${updatedComponent.id} was updated.`,
        );
      }
    }
  } catch (err) {
    console.error(`Failed to create or update compass component for "${name}" project after all retries`, err);

    await setFailedRepositoriesToStore(project);
  }
});

export const run = resolver.getDefinitions();
