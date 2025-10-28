import graphqlGateway from '@atlassian/forge-graphql';
import { ConfigFileActions } from '@atlassian/forge-graphql-types';
import * as compassApi from './compass';
import * as labelsUtils from '../utils/labels-utils';
import * as slugUtils from '../utils/component-slug';
import * as agg from './agg';
import * as queries from './graphqlQuery/get-tenat-context-query';
import * as teamsQuery from './graphqlQuery/get-teams-query';
import { AggClientError } from '../models/errors';
import { UNKNOWN_EXTERNAL_ALIAS_ERROR_MESSAGE } from '../models/error-messages';
import { COMPASS_GATEWAY_MESSAGES, ImportableProject } from '../types';

jest.mock('@atlassian/forge-graphql');
jest.mock('../utils/labels-utils');
jest.mock('../utils/component-slug');
jest.mock('./agg');
jest.mock('./graphqlQuery/get-tenat-context-query');
jest.mock('./graphqlQuery/get-teams-query');

const mockAsApp = jest.fn();
const mockConfigAsCode = jest.fn();
const mockCompass = {
  asApp: mockAsApp,
  configAsCode: { asApp: mockConfigAsCode },
};
const mockCreateComponent = jest.fn();
const mockUpdateComponent = jest.fn();
const mockUpdateDataManager = jest.fn();
const mockDetachDataManager = jest.fn();
const mockDeleteExternalAlias = jest.fn();
const mockUnlinkExternalSource = jest.fn();
const mockUnlinkComponent = jest.fn();
const mockGetComponentByExternalAlias = jest.fn();
const mockCreateEvent = jest.fn();
const mockInsertMetricValueByExternalId = jest.fn();
const mockSyncComponentWithFile = jest.fn();
const mockGetComponent = jest.fn();
const mockGetAllComponentTypes = jest.fn();
const mockResyncRepoFiles = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (graphqlGateway as any).compass = {
    asApp: () => ({
      createComponent: mockCreateComponent,
      updateComponent: mockUpdateComponent,
      updateDataManager: mockUpdateDataManager,
      detachDataManager: mockDetachDataManager,
      deleteExternalAlias: mockDeleteExternalAlias,
      unlinkExternalSource: mockUnlinkExternalSource,
      getComponentByExternalAlias: mockGetComponentByExternalAlias,
      createEvent: mockCreateEvent,
      insertMetricValueByExternalId: mockInsertMetricValueByExternalId,
      getComponent: mockGetComponent,
      getAllComponentTypes: mockGetAllComponentTypes,
      resyncRepoFiles: mockResyncRepoFiles,
    }),
    configAsCode: {
      asApp: () => ({
        unlinkComponent: mockUnlinkComponent,
        syncComponentWithFile: mockSyncComponentWithFile,
      }),
    },
  };
});

describe('compassApi', () => {
  describe('createComponent', () => {
    it('should create a component and return it', async () => {
      (labelsUtils.formatLabels as jest.Mock).mockReturnValue(['foo']);
      mockCreateComponent.mockResolvedValue({ data: { component: { id: '123' } }, errors: [] });
      const project = {
        name: 'name',
        description: 'desc',
        typeId: 'type',
        labels: ['foo'],
        url: 'u',
        ownerId: 'ownerid',
        id: 1,
      } as ImportableProject;
      const result = await compassApi.createComponent('cloud', project);

      expect(result).toEqual({ id: '123' });
      expect(mockCreateComponent).toHaveBeenCalled();
    });

    it('should throw AggClientError on client error', async () => {
      (labelsUtils.formatLabels as jest.Mock).mockReturnValue(['foo']);
      mockCreateComponent.mockResolvedValue({
        data: {},
        errors: [{ statusCode: 400, message: 'bad' }],
      });
      const project = {
        name: 'name',
        description: 'desc',
        typeId: 't',
        labels: ['foo'],
        url: 'url',
        ownerId: 'owner',
        id: 1,
      } as ImportableProject;

      await expect(compassApi.createComponent('cloud', project)).rejects.toBeInstanceOf(AggClientError);
    });
  });

  describe('createComponentSlug', () => {
    it('should call updateComponent and return on success', async () => {
      (slugUtils.convertToCompassSlug as jest.Mock).mockReturnValue('slug');
      mockUpdateComponent.mockResolvedValue({ errors: [] });
      await compassApi.createComponentSlug('id', 'repo');

      expect(mockUpdateComponent).toHaveBeenCalledWith({ id: 'id', slug: 'slug' });
    });

    it('should retry with -1 if slug is duplicate', async () => {
      (slugUtils.convertToCompassSlug as jest.Mock).mockReturnValue('slug');
      mockUpdateComponent
        .mockResolvedValueOnce({ errors: [{ message: 'Another component with the slug' }] })
        .mockResolvedValueOnce({ errors: [] });
      await compassApi.createComponentSlug('id', 'repo');

      expect(mockUpdateComponent).toHaveBeenCalledTimes(2);
      expect(mockUpdateComponent.mock.calls[1][0].slug).toBe('slug-1');
    });
  });

  describe('updateComponent', () => {
    it('should update and return component', async () => {
      mockUpdateComponent.mockResolvedValue({ data: { component: { id: 'c' } }, errors: [] });
      const result = await compassApi.updateComponent({} as any);
      expect(result).toEqual({ id: 'c' });
    });

    it('should throw on error', async () => {
      mockUpdateComponent.mockResolvedValue({ data: {}, errors: [{ statusCode: 400, message: 'bad' }] });

      await expect(compassApi.updateComponent({} as any)).rejects.toBeInstanceOf(AggClientError);
    });
  });

  describe('updateDataManager', () => {
    it('should call updateDataManager and not throw on no errors', async () => {
      mockUpdateDataManager.mockResolvedValue({ errors: [] });
      await expect(compassApi.updateDataManager({} as any)).resolves.toBeUndefined();
    });
    it('should throw on error', async () => {
      mockUpdateDataManager.mockResolvedValue({ errors: [{ statusCode: 400, message: 'bad' }] });
      await expect(compassApi.updateDataManager({} as any)).rejects.toBeInstanceOf(AggClientError);
    });
  });

  describe('detachDataManager', () => {
    it('should call detachDataManager and not throw on no errors', async () => {
      mockDetachDataManager.mockResolvedValue({ errors: [] });
      await expect(compassApi.detachDataManager({} as any)).resolves.toBeUndefined();
    });
    it('should throw on error', async () => {
      mockDetachDataManager.mockResolvedValue({ errors: [{ statusCode: 400, message: 'bad' }] });
      await expect(compassApi.detachDataManager({} as any)).rejects.toBeInstanceOf(AggClientError);
    });
  });

  describe('deleteExternalAlias', () => {
    it('should warn and return if alias not found', async () => {
      mockDeleteExternalAlias.mockResolvedValue({
        errors: [{ message: UNKNOWN_EXTERNAL_ALIAS_ERROR_MESSAGE }],
      });
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      await expect(compassApi.deleteExternalAlias({} as any)).resolves.toBeUndefined();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
    it('should throw on other errors', async () => {
      mockDeleteExternalAlias.mockResolvedValue({ errors: [{ statusCode: 400, message: 'bad' }] });
      await expect(compassApi.deleteExternalAlias({} as any)).rejects.toBeInstanceOf(AggClientError);
    });
  });

  describe('unlinkCompassComponents', () => {
    it('should call unlinkExternalSource and not throw on no errors', async () => {
      mockUnlinkExternalSource.mockResolvedValue({ errors: [] });
      await expect(compassApi.unlinkCompassComponents('c', 'e')).resolves.toBeUndefined();
    });
    it('should throw on error', async () => {
      mockUnlinkExternalSource.mockResolvedValue({ errors: [{ statusCode: 400, message: 'bad' }] });
      await expect(compassApi.unlinkCompassComponents('c', 'e')).rejects.toBeInstanceOf(AggClientError);
    });
  });

  describe('unlinkComponentFromFile', () => {
    it('should call unlinkComponent and not throw on no errors', async () => {
      mockUnlinkComponent.mockResolvedValue({ errors: [] });
      await expect(compassApi.unlinkComponentFromFile({} as any)).resolves.toBeUndefined();
    });
    it('should throw on error', async () => {
      mockUnlinkComponent.mockResolvedValue({ errors: [{ statusCode: 400, message: 'bad' }] });
      await expect(compassApi.unlinkComponentFromFile({} as any)).rejects.toBeInstanceOf(AggClientError);
    });
  });

  describe('getComponentByExternalAlias', () => {
    it('should return null if not found', async () => {
      mockGetComponentByExternalAlias.mockResolvedValue({
        errors: [{ message: COMPASS_GATEWAY_MESSAGES.COMPONENT_NOT_FOUND }],
        data: {},
      });
      const result = await compassApi.getComponentByExternalAlias({} as any);
      expect(result).toEqual({ component: null });
    });
    it('should throw on error', async () => {
      mockGetComponentByExternalAlias.mockResolvedValue({
        errors: [{ statusCode: 400, message: 'bad' }],
        data: {},
      });
      await expect(compassApi.getComponentByExternalAlias({} as any)).rejects.toBeInstanceOf(AggClientError);
    });
    it('should return data on success', async () => {
      mockGetComponentByExternalAlias.mockResolvedValue({ errors: [], data: { component: { id: 'c' } } });
      const result = await compassApi.getComponentByExternalAlias({} as any);
      expect(result).toEqual({ component: { id: 'c' } });
    });
  });

  describe('sendEvents', () => {
    it('should call createEvent and not throw on no errors', async () => {
      mockCreateEvent.mockResolvedValue({ errors: [], data: {} });
      await expect(compassApi.sendEvents({} as any)).resolves.toEqual({});
    });
    it('should throw on error', async () => {
      mockCreateEvent.mockResolvedValue({ errors: [{ statusCode: 400, message: 'bad' }], data: {} });
      await expect(compassApi.sendEvents({} as any)).rejects.toBeInstanceOf(AggClientError);
    });
  });

  describe('insertMetricValueByExternalId', () => {
    it('should call insertMetricValueByExternalId and not throw on no errors', async () => {
      mockInsertMetricValueByExternalId.mockResolvedValue({ errors: [], data: {} });
      await expect(
        compassApi.insertMetricValueByExternalId('cloudId', 'project-id', { metricAri: 'metric-ari', value: 1 }),
      ).resolves.toEqual({});
    });
    it('should throw on error', async () => {
      mockInsertMetricValueByExternalId.mockResolvedValue({ errors: [{ statusCode: 400, message: 'bad' }], data: {} });
      await expect(
        compassApi.insertMetricValueByExternalId('cloudId', 'project-id', { metricAri: 'metric-ari', value: 1 }),
      ).rejects.toBeInstanceOf(AggClientError);
    });
  });

  describe('syncComponentWithFile', () => {
    it('should call syncComponentWithFile and not throw on no errors', async () => {
      mockSyncComponentWithFile.mockResolvedValue({ errors: [], data: { component: { id: 'c' } } });
      await expect(
        compassApi.syncComponentWithFile({
          cloudId: '',
          configFile: '',
          configFileMetadata: {
            configFileAction: ConfigFileActions.CREATE,
            newPath: '',
            oldPath: '',
            deduplicationId: '',
          },
        }),
      ).resolves.toEqual({ component: { id: 'c' } });
    });
    it('should throw on error', async () => {
      mockSyncComponentWithFile.mockResolvedValue({ errors: [{ statusCode: 400, message: 'bad' }], data: {} });
      await expect(
        compassApi.syncComponentWithFile({
          cloudId: '',
          configFile: '',
          configFileMetadata: {
            configFileAction: ConfigFileActions.CREATE,
            newPath: '',
            oldPath: '',
            deduplicationId: '',
          },
        }),
      ).rejects.toBeInstanceOf(AggClientError);
    });
  });

  describe('getComponent', () => {
    it('should return null if not found', async () => {
      mockGetComponent.mockResolvedValue({
        errors: [{ message: COMPASS_GATEWAY_MESSAGES.COMPONENT_NOT_FOUND }],
        data: {},
      });
      const result = await compassApi.getComponent({} as any);
      expect(result).toEqual({ component: null });
    });
    it('should throw on error', async () => {
      mockGetComponent.mockResolvedValue({
        errors: [{ statusCode: 400, message: 'bad' }],
        data: {},
      });

      await expect(
        compassApi.getComponent({
          componentId: '',
        }),
      ).rejects.toBeInstanceOf(AggClientError);
    });
    it('should return data on success', async () => {
      mockGetComponent.mockResolvedValue({ errors: [], data: { component: { id: 'id' } } });
      const result = await compassApi.getComponent({
        componentId: '',
      });

      expect(result).toEqual({ component: { id: 'id' } });
    });
  });

  describe('getAllComponentTypes', () => {
    it('should return componentTypes', async () => {
      mockGetAllComponentTypes.mockResolvedValue({ data: { componentTypes: [{ id: 'id' }] }, errors: [] });
      const result = await compassApi.getAllComponentTypes('cloud');

      expect(result).toEqual([{ id: 'id' }]);
    });
    it('should throw on error', async () => {
      mockGetAllComponentTypes.mockResolvedValue({ data: {}, errors: [{ statusCode: 400, message: 'bad' }] });

      await expect(compassApi.getAllComponentTypes('cloud')).rejects.toBeInstanceOf(AggClientError);
    });
  });

  describe('getTenantContext', () => {
    it('should call getTenantContextQuery and aggQuery', async () => {
      (queries.getTenantContextQuery as jest.Mock).mockReturnValue('query');
      (agg.aggQuery as jest.Mock).mockResolvedValue({ foo: 'bar' });
      const result = await compassApi.getTenantContext('cloud');

      expect(result).toEqual({ foo: 'bar' });
      expect(queries.getTenantContextQuery).toHaveBeenCalledWith('cloud');
      expect(agg.aggQuery).toHaveBeenCalledWith('query');
    });
  });

  describe('getTeams', () => {
    it('should call getTeamsQuery and aggQuery and return nodes', async () => {
      (teamsQuery.getTeamsQuery as jest.Mock).mockReturnValue('query');
      (agg.aggQuery as jest.Mock).mockResolvedValue({ team: { teamSearchV2: { nodes: [{ id: 't' }] } } });
      const result = await compassApi.getTeams('org', 'cloud');

      expect(result).toEqual([{ id: 't' }]);
      expect(teamsQuery.getTeamsQuery).toHaveBeenCalled();
      expect(agg.aggQuery).toHaveBeenCalled();
    });
  });

  describe('resyncRepoFiles', () => {
    it('should log errors but not throw on client or gateway errors', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockResyncRepoFiles.mockResolvedValue({
        errors: [
          { statusCode: 400, message: 'bad client' },
          { statusCode: 500, message: 'bad gateway' },
        ],
      });
      await compassApi.resyncRepoFiles({
        baseRepoUrl: '',
        changedFiles: [],
        cloudId: '',
        repoId: '',
      });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
    it('should not log if no errors', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockResyncRepoFiles.mockResolvedValue({ errors: [] });
      await compassApi.resyncRepoFiles({
        baseRepoUrl: '',
        changedFiles: [],
        cloudId: '',
        repoId: '',
      });
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
