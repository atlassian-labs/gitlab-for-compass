import { render } from '@testing-library/react';
import { view as realView } from '@forge/bridge';
import { RotateWebtriggerModal } from './RotateWebtriggerModal';

jest.mock('@forge/bridge', () => ({
  view: { close: jest.fn() },
}));
const mockCloseView: jest.Mock = realView.close as any;

const TEST_GROUP_NAME = 'test-group-name';

describe('Renders rotate webhook modal', () => {
  beforeEach(() => {
    mockCloseView.mockReset();
  });

  it('renders rotate webhook message', async () => {
    const { findByText } = render(<RotateWebtriggerModal groupName={TEST_GROUP_NAME} />);
    expect(await findByText('Rotate webhook')).toBeDefined();
    expect(await findByText(TEST_GROUP_NAME)).toBeDefined();
  });

  it('passes true to onClose method when Rotate is clicked', async () => {
    const { findByText } = render(<RotateWebtriggerModal groupName={TEST_GROUP_NAME} />);
    const button = await findByText('Rotate');
    button.click();
    expect(mockCloseView).toBeCalledWith(true);
  });

  it('passes false to onClose method when Cancel is clicked', async () => {
    const { findByText } = render(<RotateWebtriggerModal groupName={TEST_GROUP_NAME} />);
    const button = await findByText('Cancel');
    button.click();
    expect(mockCloseView).toBeCalledWith(false);
  });
});
