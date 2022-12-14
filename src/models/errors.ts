/* eslint-disable max-classes-per-file */

import { SdkError } from '@atlassian/forge-graphql';

export class AggClientError extends Error {
  errors: string[];

  constructor(returnedErrors: string[], ...params: any) {
    super(...params);
    this.errors = returnedErrors;
    this.message = returnedErrors.join(', ');
  }
}

export class InvalidConfigFileError extends Error {
  errors: string[];

  constructor(validationErrors: string[], ...params: any) {
    super(...params);
    this.errors = validationErrors;
    this.message = validationErrors.join(', ');
  }
}

export class InvalidAriError extends Error {}

export class GraphqlGatewayError extends Error {
  method: string;

  errors: SdkError[];

  constructor(method: string, sdkErrors: SdkError[], ...params: any) {
    super(...params);
    this.method = method;
    this.errors = sdkErrors;
    const concatenatedErrorMessages = sdkErrors.map((e) => e.message).join(', ');
    this.message = `Error calling ${method} in graphql gateway. Error(s): ${concatenatedErrorMessages}`;
  }
}

export class MissingAppIdError extends Error {
  constructor() {
    super('No FORGE_APP_ID environment variable is set for this app');
  }
}

export class GitlabHttpMethodError extends Error {
  statusText: string;

  status: number;

  constructor(status: number, statusText: string, ...params: any) {
    super(...params);
    this.status = status;
    this.statusText = statusText;
  }
}
