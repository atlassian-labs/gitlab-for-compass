import { AuthErrorTypes, DefaultErrorTypes } from './resolverTypes';

export const ErrorMessages = {
  [AuthErrorTypes.INVALID_GROUP_TOKEN]: {
    title: 'Group access token is invalid',
    description: [
      'We couldn’t connect your GitLab group to Compass. Check that your group access token is correct and has the ',
      'Owner',
      ' role. Otherwise, create a new token having the owner role and use it to connect your GitLab group to Compass.',
    ],
  },
  [AuthErrorTypes.INVALID_GROUP_TOKEN_NAME]: {
    title: 'Group access token name is incorrect',
    description:
      'We couldn’t find a group access token with the name you entered. Check that the token name is correct and matches the token name in GitLab.',
  },
  [DefaultErrorTypes.NO_APP_ID_VARIABLE_DEFINED]: {
    title: 'App ID variable is not defined',
    description:
      'Hello forge app developer! Check the README, but in your CLI, run forge variables set FORGE_APP_ID <ID from manifest, the part after ari:cloud:ecosystem::app/>',
  },
  [AuthErrorTypes.INCORRECT_GROUP_TOKEN_SCOPES]: {
    title: 'Group access token has incorrect scopes',
    description: [
      'Your group access token doesn’t have the scopes Compass requires to access data from GitLab. Create a new token with ',
      'api',
      ' and ',
      'write_repository',
      ' scopes and use it to connect your GitLab group to Compass.',
    ],
  },
  [AuthErrorTypes.UNEXPECTED_ERROR]: {
    title: 'Something went wrong',
    description:
      'We couldn’t connect your GitLab group to Compass. Reload the page and try connecting your GitLab group again.',
  },
};
