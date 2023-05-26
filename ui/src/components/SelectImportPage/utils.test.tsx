import { getAvailableImportComponentTypes } from './utils';

describe('getAvailableImportComponentTypes', () => {
  it('should filter out TEMPLATE component type', () => {
    const MOCK_COMPONENT_TYPES_RESULT = {
      componentTypesLoading: false,
      error: null,
      componentTypes: [
        {
          id: 'SERVICE',
        },
        {
          id: 'TEMPLATE',
        },
      ],
    };
    const expected = {
      componentTypesLoading: false,
      error: null,
      componentTypes: [
        {
          id: 'SERVICE',
        },
      ],
    };
    const returned = getAvailableImportComponentTypes(MOCK_COMPONENT_TYPES_RESULT);

    expect(returned).toEqual(expected);
  });
});
