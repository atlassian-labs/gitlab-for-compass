import { useContext } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComponentTypesContextProvider, ComponentTypesContext } from './ComponentTypesContext';
import { getAllCompassComponentTypes } from '../services/invokes';

jest.mock('@forge/bridge', () => ({
  invoke: jest.fn(),
  router: { navigate: jest.fn(), open: jest.fn() },
  showFlag: jest.fn(),
}));

jest.mock('@atlaskit/spinner', () => ({
  __esModule: true,
  default: () => <div data-testid='spinner' />,
}));
jest.mock('../services/invokes');

const mockComponentTypes = [
  { id: 'service', name: 'Service' },
  { id: 'library', name: 'Library' },
];

describe('ComponentTypesContextProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows spinner while loading', async () => {
    // getAllCompassComponentTypes returns a pending promise
    (getAllCompassComponentTypes as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(
      <ComponentTypesContextProvider>
        <div>Child</div>
      </ComponentTypesContextProvider>,
    );
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('shows error message on error', async () => {
    (getAllCompassComponentTypes as jest.Mock).mockResolvedValue({
      success: false,
      data: null,
      errors: [{ message: 'API error' }],
    });
    render(
      <ComponentTypesContextProvider>
        <div>Child</div>
      </ComponentTypesContextProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText(/There was an error loading information abut component types/i)).toBeInTheDocument(),
    );
  });

  it('shows error message on thrown error', async () => {
    (getAllCompassComponentTypes as jest.Mock).mockRejectedValue('Network error');
    render(
      <ComponentTypesContextProvider>
        <div>Child</div>
      </ComponentTypesContextProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText(/There was an error loading information abut component types/i)).toBeInTheDocument(),
    );
  });

  it('renders children and provides context on success', async () => {
    (getAllCompassComponentTypes as jest.Mock).mockResolvedValue({
      success: true,
      data: mockComponentTypes,
      errors: [],
    });

    let contextValue: any;
    const Consumer = () => {
      contextValue = useContext(ComponentTypesContext);
      return <div>Child</div>;
    };

    render(
      <ComponentTypesContextProvider>
        <Consumer />
      </ComponentTypesContextProvider>,
    );

    // Wait for loading to finish and children to render
    await waitFor(() => expect(screen.getByText('Child')).toBeInTheDocument());
    expect(contextValue.componentTypes).toEqual(mockComponentTypes);
  });
});
