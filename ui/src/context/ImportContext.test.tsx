import '@testing-library/jest-dom';
import { useContext } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImportContext, ImportContextProvider } from './ImportContext';

describe('ImportContextProvider', () => {
  function ConsumerComponent() {
    const {
      isImportInProgress,
      setIsImportInProgress,
      importedRepositories,
      setImportedRepositories,
      totalSelectedRepos,
      setTotalSelectedRepos,
    } = useContext(ImportContext);

    return (
      <div>
        <div data-testid='isImportInProgress'>{String(isImportInProgress)}</div>
        <div data-testid='importedRepositories'>{importedRepositories}</div>
        <div data-testid='totalSelectedRepos'>{totalSelectedRepos}</div>
        <button onClick={() => setIsImportInProgress(true)}>Set Import In Progress</button>
        <button onClick={() => setImportedRepositories(42)}>Set Imported Repositories</button>
        <button onClick={() => setTotalSelectedRepos(99)}>Set Total Selected Repos</button>
      </div>
    );
  }

  it('provides default values', () => {
    render(
      <ImportContextProvider>
        <ConsumerComponent />
      </ImportContextProvider>,
    );
    expect(screen.getByTestId('isImportInProgress')).toHaveTextContent('false');
    expect(screen.getByTestId('importedRepositories')).toHaveTextContent('0');
    expect(screen.getByTestId('totalSelectedRepos')).toHaveTextContent('0');
  });

  it('updates isImportInProgress via setter', () => {
    render(
      <ImportContextProvider>
        <ConsumerComponent />
      </ImportContextProvider>,
    );
    fireEvent.click(screen.getByText('Set Import In Progress'));
    expect(screen.getByTestId('isImportInProgress')).toHaveTextContent('true');
  });

  it('updates importedRepositories via setter', () => {
    render(
      <ImportContextProvider>
        <ConsumerComponent />
      </ImportContextProvider>,
    );
    fireEvent.click(screen.getByText('Set Imported Repositories'));
    expect(screen.getByTestId('importedRepositories')).toHaveTextContent('42');
  });

  it('updates totalSelectedRepos via setter', () => {
    render(
      <ImportContextProvider>
        <ConsumerComponent />
      </ImportContextProvider>,
    );
    fireEvent.click(screen.getByText('Set Total Selected Repos'));
    expect(screen.getByTestId('totalSelectedRepos')).toHaveTextContent('99');
  });
});
