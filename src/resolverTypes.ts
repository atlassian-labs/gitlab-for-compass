import {
  GitlabAPIGroup,
  ImportableProject,
  ImportStatus,
  ProjectReadyForImport,
  ProjectImportResult,
  GroupProjectsResponse,
} from './types';
import { FeaturesList } from './features';

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

type ErrorTypes = AuthErrorTypes | ImportErrorTypes | DefaultErrorTypes;

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
