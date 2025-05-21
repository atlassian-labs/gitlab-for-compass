/* eslint-disable import/first */
import graphqlGateway from '@atlassian/forge-graphql';
import handler from './admin-resolvers';
import * as mockServices from '../services/group';
import * as mockWebhookServices from '../services/webhooks';
import { AuthErrorTypes } from '../resolverTypes';
import { InvalidGroupTokenError } from '../services/group';
import { GitLabRoles } from '../types';
import * as mockForgeAppId from '../utils/get-forge-app-id';
import {
  MOCK_CLOUD_ID,
  MOCK_GROUP_ID,
  MOCK_WEBHOOK_ID,
  MOCK_WEBHOOK_SECRET,
  MOCK_GROUP_TOKEN,
  MOCK_GROUP_TOKEN_NAME,
  MOCK_GROUP_NAME,
  MOCK_FORGE_APP_ID,
  MOCK_GROUP,
  MOCK_URL_REGEX,
} from './mocks';

describe('adminResolvers', () => {
  jest.mock('@atlassian/forge-graphql', () => ({
    graphqlGateway: {
      compass: {
        asApp: jest.fn(() => ({
          synchronizeLinkAssociations: jest.fn(),
        })),
      },
    },
  }));
  jest.mock('../utils/get-forge-app-id');
  jest.mock('../services/group');
  jest.mock('../services/webhooks');

  let synchronizeLinkAssociationsMock: jest.Mock<Promise<{ success: boolean }>>;

  beforeEach(() => {
    synchronizeLinkAssociationsMock = jest.fn().mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('groups/connect', () => {
    test('successfully connects group without webhook setup for Maintainer role', async () => {
      (graphqlGateway as any).compass = {
        asApp: jest.fn(() => ({
          synchronizeLinkAssociations: synchronizeLinkAssociationsMock,
        })),
      };

      const getGroupByIdSpy = jest.spyOn(mockServices, 'connectGroup').mockResolvedValueOnce(MOCK_GROUP_ID);

      const invokePayload = {
        call: {
          functionKey: 'groups/connect',
          payload: {
            groupToken: MOCK_GROUP_TOKEN,
            groupTokenName: MOCK_GROUP_TOKEN_NAME,
            groupRole: GitLabRoles.MAINTAINER,
            groupName: MOCK_GROUP_NAME,
          },
        },
        context: {
          cloudId: MOCK_CLOUD_ID,
        },
      };

      const response = await handler(invokePayload);

      expect(response).toEqual({ success: true });

      expect(mockServices.connectGroup).toHaveBeenCalledWith({
        token: MOCK_GROUP_TOKEN,
        tokenName: MOCK_GROUP_TOKEN_NAME,
        tokenRole: GitLabRoles.MAINTAINER,
        groupName: MOCK_GROUP_NAME,
      });
    });

    test('successfully connects group for Owner role', async () => {
      (graphqlGateway as any).compass = {
        asApp: jest.fn(() => ({
          synchronizeLinkAssociations: synchronizeLinkAssociationsMock,
        })),
      };

      jest.spyOn(mockServices, 'connectGroup').mockResolvedValueOnce(MOCK_GROUP_ID);
      jest.spyOn(mockServices, 'getGroupById').mockResolvedValueOnce(MOCK_GROUP);
      jest.spyOn(mockWebhookServices, 'setupAndValidateWebhook').mockResolvedValueOnce(MOCK_GROUP_ID);
      jest.spyOn(mockForgeAppId, 'getForgeAppId').mockReturnValueOnce(MOCK_FORGE_APP_ID);

      const invokePayload = {
        call: {
          functionKey: 'groups/connect',
          payload: {
            groupToken: MOCK_GROUP_TOKEN,
            groupTokenName: MOCK_GROUP_TOKEN_NAME,
            groupRole: GitLabRoles.OWNER,
            groupName: MOCK_GROUP_NAME,
          },
        },
        context: {
          cloudId: MOCK_CLOUD_ID,
        },
      };

      const response = await handler(invokePayload);

      expect(response).toEqual({ success: true });

      expect(mockServices.connectGroup).toHaveBeenCalledWith({
        token: MOCK_GROUP_TOKEN,
        tokenName: MOCK_GROUP_TOKEN_NAME,
        tokenRole: GitLabRoles.OWNER,
        groupName: MOCK_GROUP_NAME,
      });
      expect(mockServices.getGroupById).toHaveBeenCalledWith(MOCK_GROUP_ID);
      expect(mockWebhookServices.setupAndValidateWebhook).toHaveBeenCalledWith(MOCK_GROUP_ID);
      expect(synchronizeLinkAssociationsMock).toHaveBeenCalledWith({
        cloudId: MOCK_CLOUD_ID,
        forgeAppId: expect.any(String),
        options: {
          urlFilterRegex: MOCK_URL_REGEX,
        },
      });
    });

    test('gracefully handles getGroupById returning no group', async () => {
      (graphqlGateway as any).compass = {
        asApp: jest.fn(() => ({
          synchronizeLinkAssociations: synchronizeLinkAssociationsMock,
        })),
      };

      jest.spyOn(mockServices, 'connectGroup').mockResolvedValueOnce(MOCK_GROUP_ID);
      jest.spyOn(mockServices, 'getGroupById').mockResolvedValueOnce(undefined);
      jest.spyOn(mockWebhookServices, 'setupAndValidateWebhook').mockResolvedValueOnce(MOCK_GROUP_ID);
      jest.spyOn(mockForgeAppId, 'getForgeAppId').mockReturnValueOnce(MOCK_FORGE_APP_ID);

      const invokePayload = {
        call: {
          functionKey: 'groups/connect',
          payload: {
            groupToken: MOCK_GROUP_TOKEN,
            groupTokenName: MOCK_GROUP_TOKEN_NAME,
            groupRole: GitLabRoles.OWNER,
            groupName: MOCK_GROUP_NAME,
          },
        },
        context: {
          cloudId: MOCK_CLOUD_ID,
        },
      };

      const response = await handler(invokePayload);

      expect(response).toEqual({ success: true });

      expect(mockServices.connectGroup).toHaveBeenCalledWith({
        token: MOCK_GROUP_TOKEN,
        tokenName: MOCK_GROUP_TOKEN_NAME,
        tokenRole: GitLabRoles.OWNER,
        groupName: MOCK_GROUP_NAME,
      });
      expect(mockServices.getGroupById).toHaveBeenCalledWith(MOCK_GROUP_ID);
      expect(mockWebhookServices.setupAndValidateWebhook).toHaveBeenCalledWith(MOCK_GROUP_ID);
      expect(synchronizeLinkAssociationsMock).toHaveBeenCalledWith({
        cloudId: MOCK_CLOUD_ID,
        forgeAppId: expect.any(String),
        options: {},
      });
    });

    test('not successful when group function throws error', async () => {
      (graphqlGateway as any).compass = {
        asApp: jest.fn(() => ({
          synchronizeLinkAssociations: synchronizeLinkAssociationsMock,
        })),
      };

      jest
        .spyOn(mockServices, 'connectGroup')
        .mockRejectedValueOnce(new InvalidGroupTokenError(AuthErrorTypes.INVALID_GROUP_TOKEN));
      jest.spyOn(mockServices, 'getGroupById').mockResolvedValueOnce(undefined);
      jest.spyOn(mockWebhookServices, 'setupAndValidateWebhook').mockResolvedValueOnce(MOCK_GROUP_ID);
      jest.spyOn(mockForgeAppId, 'getForgeAppId').mockReturnValueOnce(MOCK_FORGE_APP_ID);

      const invokePayload = {
        call: {
          functionKey: 'groups/connect',
          payload: {
            groupToken: MOCK_GROUP_TOKEN,
            groupTokenName: MOCK_GROUP_TOKEN_NAME,
            groupRole: GitLabRoles.OWNER,
            groupName: MOCK_GROUP_NAME,
          },
        },
        context: {
          cloudId: MOCK_CLOUD_ID,
        },
      };

      const response = await handler(invokePayload);

      expect(response).toEqual({
        success: false,
        errors: [{ message: 'Token validation error.', errorType: AuthErrorTypes.INVALID_GROUP_TOKEN }],
      });

      expect(mockServices.connectGroup).toHaveBeenCalledWith({
        token: MOCK_GROUP_TOKEN,
        tokenName: MOCK_GROUP_TOKEN_NAME,
        tokenRole: GitLabRoles.OWNER,
        groupName: MOCK_GROUP_NAME,
      });
      expect(mockServices.getGroupById).not.toHaveBeenCalled();
      expect(mockWebhookServices.setupAndValidateWebhook).not.toHaveBeenCalled();
      expect(synchronizeLinkAssociationsMock).not.toHaveBeenCalled();
    });
  });

  describe('webhooks/connectInProgress', () => {
    test('successfully connects webhook in progress', async () => {
      (graphqlGateway as any).compass = {
        asApp: jest.fn(() => ({
          synchronizeLinkAssociations: synchronizeLinkAssociationsMock,
        })),
      };

      jest.spyOn(mockServices, 'getGroupById').mockResolvedValueOnce(MOCK_GROUP);
      jest.spyOn(mockWebhookServices, 'setupAndValidateWebhook').mockResolvedValueOnce(MOCK_GROUP_ID);
      jest.spyOn(mockForgeAppId, 'getForgeAppId').mockReturnValueOnce(MOCK_FORGE_APP_ID);

      const invokePayload = {
        call: {
          functionKey: 'webhooks/connectInProgress',
          payload: {
            groupId: MOCK_GROUP_ID,
            webhookId: MOCK_WEBHOOK_ID,
            webhookSecretToken: MOCK_WEBHOOK_SECRET,
          },
        },
        context: {
          cloudId: MOCK_CLOUD_ID,
        },
      };

      const response = await handler(invokePayload);

      expect(response).toEqual({ success: true });
      expect(mockWebhookServices.setupAndValidateWebhook).toHaveBeenCalledWith(
        MOCK_GROUP_ID,
        MOCK_WEBHOOK_ID,
        MOCK_WEBHOOK_SECRET,
      );
      expect(mockServices.getGroupById).toHaveBeenCalledWith(MOCK_GROUP_ID);
      expect(synchronizeLinkAssociationsMock).toHaveBeenCalledWith({
        cloudId: MOCK_CLOUD_ID,
        forgeAppId: MOCK_FORGE_APP_ID,
        options: {
          urlFilterRegex: MOCK_URL_REGEX,
        },
      });
    });

    test('gracefully handles getGroupById returning no group', async () => {
      (graphqlGateway as any).compass = {
        asApp: jest.fn(() => ({
          synchronizeLinkAssociations: synchronizeLinkAssociationsMock,
        })),
      };

      jest.spyOn(mockServices, 'getGroupById').mockResolvedValueOnce(undefined);
      jest.spyOn(mockWebhookServices, 'setupAndValidateWebhook').mockResolvedValueOnce(MOCK_GROUP_ID);
      jest.spyOn(mockForgeAppId, 'getForgeAppId').mockReturnValueOnce(MOCK_FORGE_APP_ID);

      const invokePayload = {
        call: {
          functionKey: 'webhooks/connectInProgress',
          payload: {
            groupId: MOCK_GROUP_ID,
            webhookId: MOCK_WEBHOOK_ID,
            webhookSecretToken: MOCK_WEBHOOK_SECRET,
          },
        },
        context: {
          cloudId: MOCK_CLOUD_ID,
        },
      };

      const response = await handler(invokePayload);

      expect(response).toEqual({ success: true });
      expect(mockWebhookServices.setupAndValidateWebhook).toHaveBeenCalledWith(
        MOCK_GROUP_ID,
        MOCK_WEBHOOK_ID,
        MOCK_WEBHOOK_SECRET,
      );
      expect(mockServices.getGroupById).toHaveBeenCalledWith(MOCK_GROUP_ID);
      expect(synchronizeLinkAssociationsMock).toHaveBeenCalledWith({
        cloudId: MOCK_CLOUD_ID,
        forgeAppId: MOCK_FORGE_APP_ID,
        options: {},
      });
    });

    test('not successful if error is thrown', async () => {
      (graphqlGateway as any).compass = {
        asApp: jest.fn(() => ({
          synchronizeLinkAssociations: synchronizeLinkAssociationsMock,
        })),
      };

      jest.spyOn(mockServices, 'getGroupById').mockResolvedValueOnce(MOCK_GROUP);
      jest.spyOn(mockWebhookServices, 'setupAndValidateWebhook').mockRejectedValueOnce(new Error('some error'));
      jest.spyOn(mockForgeAppId, 'getForgeAppId').mockReturnValueOnce(MOCK_FORGE_APP_ID);

      const invokePayload = {
        call: {
          functionKey: 'webhooks/connectInProgress',
          payload: {
            groupId: MOCK_GROUP_ID,
            webhookId: MOCK_WEBHOOK_ID,
            webhookSecretToken: MOCK_WEBHOOK_SECRET,
          },
        },
        context: {
          cloudId: MOCK_CLOUD_ID,
        },
      };

      const response = await handler(invokePayload);

      expect(response).toEqual({
        success: false,
        errors: [{ message: 'some error', errorType: AuthErrorTypes.UNEXPECTED_ERROR }],
      });
    });
  });
});
