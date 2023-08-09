import { CompassBuildEventState, CompassCreateEventInput, DataProviderBuildEvent } from '@atlassian/forge-graphql';
import { max } from 'lodash';
import { truncateProjectNameString } from './deployment';

import { GitlabPipelineStates, GitlabApiPipeline, PipelineEvent } from '../types';

export const pipelineLastUpdated = (pipeline: PipelineEvent): Date => {
  if (pipeline.object_attributes.finished_at !== null) {
    return new Date(pipeline.object_attributes.finished_at);
  }
  let latestTime = new Date(pipeline.object_attributes.created_at).getTime();
  for (const build of pipeline.builds) {
    latestTime = max([new Date(build.started_at).getTime(), new Date(build.finished_at).getTime(), latestTime]);
  }
  return new Date(latestTime);
};

export const toCompassBuildState = (state: string): CompassBuildEventState => {
  switch (state) {
    case GitlabPipelineStates.CREATED:
    case GitlabPipelineStates.WAITING_FOR_RESOURCE:
    case GitlabPipelineStates.PREPARING:
    case GitlabPipelineStates.PENDING:
    case GitlabPipelineStates.RUNNING:
    case GitlabPipelineStates.MANUAL:
      return CompassBuildEventState.InProgress;
    case GitlabPipelineStates.SUCCESS:
      return CompassBuildEventState.Successful;
    case GitlabPipelineStates.FAILED:
      return CompassBuildEventState.Failed;
    case GitlabPipelineStates.CANCELED:
      return CompassBuildEventState.Cancelled;
    case GitlabPipelineStates.SCHEDULED:
      return CompassBuildEventState.Unknown;
    default:
      return CompassBuildEventState.Unknown;
  }
};

export const webhookPipelineEventToCompassBuildEvent = (
  pipeline: PipelineEvent,
  cloudId: string,
): CompassCreateEventInput => {
  const lastUpdated = pipelineLastUpdated(pipeline);
  return {
    cloudId,
    event: {
      build: {
        externalEventSourceId: pipeline.project.id.toString(),
        updateSequenceNumber: lastUpdated.getTime(),
        displayName: truncateProjectNameString(``, pipeline.project.name, ` pipeline ${pipeline.object_attributes.id}`),
        description: truncateProjectNameString(
          `Pipeline run ${pipeline.object_attributes.id} for project `,
          pipeline.project.name,
          ``,
        ),
        url: `${pipeline.project.web_url}/-/pipelines/${pipeline.object_attributes.id}`,
        lastUpdated: lastUpdated.toISOString(),
        buildProperties: {
          pipeline: {
            pipelineId: pipeline.object_attributes.id.toString(),
          },
          state: toCompassBuildState(pipeline.object_attributes.status),
          startedAt: new Date(pipeline.object_attributes.created_at).toISOString(),
          completedAt: new Date(pipeline.object_attributes.finished_at).toISOString(),
        },
      },
    },
  };
};

export const gitlabApiPipelineToCompassDataProviderBuildEvent = (
  pipeline: GitlabApiPipeline,
  projectName: string,
): DataProviderBuildEvent => {
  const isCompleted = !(toCompassBuildState(pipeline.status) === CompassBuildEventState.InProgress);

  return {
    description: truncateProjectNameString(`Pipeline run ${pipeline.id} for project `, projectName, ``),
    displayName: truncateProjectNameString(``, projectName, ` pipeline ${pipeline.id}`),
    state: toCompassBuildState(pipeline.status),
    startedAt: new Date(pipeline.created_at).toISOString(),
    completedAt: isCompleted ? new Date(pipeline.updated_at).toISOString() : null,
    lastUpdated: new Date(pipeline.updated_at).toISOString(),
    updateSequenceNumber: new Date(pipeline.updated_at).getTime(),
    url: pipeline.web_url,
    pipeline: {
      pipelineId: pipeline.id.toString(),
    },
  };
};
