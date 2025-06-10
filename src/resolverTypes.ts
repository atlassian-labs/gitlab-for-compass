import {
  GitlabAPIGroup,
  ImportableProject,
  ImportStatus,
  ProjectReadyForImport,
  ProjectImportResult,
  GroupProjectsResponse,
} from './types';
import { FeaturesList } from './features';

/*
  TO EDIT THIS FILE, you must edit the file in the repo's src directory and running yarn ui:build or yarn ui:prebuild will generate the types in the ui/src directory.

  This file contains types that are used in both of the directories and need to stay in sync. So, the ui/src types are gitignored
 */

export enum DefaultErrorTypes {
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
  NO_APP_ID_VARIABLE_DEFINED = 'NO_APP_ID_VARIABLE_DEFINED',
}

export enum AuthErrorTypes {
  INVALID_GROUP_TOKEN = 'INVALID_GROUP_TOKEN',
  INVALID_GROUP_TOKEN_NAME = 'INVALID_GROUP_TOKEN_NAME',
  INCORRECT_GROUP_TOKEN_SCOPES = 'INCORRECT_GROUP_TOKEN_SCOPES',
  INVALID_GROUP_NAME = 'INVALID_GROUP_NAME',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
}
export enum ImportErrorTypes {
  ONE_TIME_IMPORT_LIMIT = 'IMPORT_PROJECTS_ONE_TIME_LIMIT',
  UNEXPECTED_ERROR = 'IMPORT_PROJECTS_UNEXPECTED',
  CANNOT_GET_PROGRESS_STATUS = 'CANNOT_GET_PROGRESS_STATUS',
  CANNOT_GET_IMPORT_RESULT = 'CANNOT_GET_IMPORT_RESULT',
  FAILED_CLEAR_IMPORT_RESULT = 'FAILED_CLEAR_IMPORT_RESULT',
}

export enum ResyncErrorTypes {
  RESYNC_TIME_LIMIT = 'RESYNC_CAC_TIME_LIMIT',
}

type ErrorTypes = AuthErrorTypes | ImportErrorTypes | DefaultErrorTypes | ResyncErrorTypes;

type ResponseError = { message: string; errorType?: ErrorTypes };

type ResolverResponse<T = void> = {
  success: boolean;
  errors?: ResponseError[];
  data?: T;
};

export type {
  GitlabAPIGroup,
  ResponseError,
  ResolverResponse,
  ErrorTypes,
  ImportableProject,
  ProjectReadyForImport,
  ProjectImportResult,
  ImportStatus,
  FeaturesList,
  GroupProjectsResponse,
};
