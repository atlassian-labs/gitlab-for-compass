import { AuthErrorTypes, StoreTokenErrorTypes } from '../../resolverTypes';

export const ErrorMessages = {
  [AuthErrorTypes.INVALID_GROUP_TOKEN]: {
    title: 'Group access token is invalid',
    description: [
      'We couldn’t rotate your GitLab group token in Compass. Check that your group access token is correct and has the ',
      'Owner',
      ' role. Otherwise, create a new token having the owner role and use it to rotate your GitLab group token in Compass.',
    ],
  },
  [AuthErrorTypes.INVALID_GROUP_TOKEN_NAME]: {
    title: 'Group access token name is incorrect',
    description:
      'We couldn’t find a group access token with the name you entered. Check that the token name is correct and matches the token name in GitLab.',
  },
  [AuthErrorTypes.INCORRECT_GROUP_TOKEN_SCOPES]: {
    title: 'Group access token has incorrect scopes',
    description: [
      'Your group access token doesn’t have the scopes Compass requires to access data from GitLab. Create a new token with ',
      'api',
      ' and ',
      'write_repository',
      ' scopes and use it to rotate your GitLab group token to Compass.',
    ],
  },
  [AuthErrorTypes.UNEXPECTED_ERROR]: {
    title: 'Something went wrong',
    description:
      'We couldn’t rotate your GitLab group token in Compass. Reload the page and try rotating your GitLab group token again.',
  },
  [StoreTokenErrorTypes.STORE_ERROR]: {
    title: 'Something went wrong while saving token in Compass',
    description:
      'We have an issue while saving the GitLab group token in Compass. Reload the page and try rotating your GitLab group token again.',
  },
};
