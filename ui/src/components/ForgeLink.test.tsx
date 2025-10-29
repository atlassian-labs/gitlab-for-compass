import { render, screen } from '@testing-library/react';
import { router } from '@forge/bridge';
import { ForgeLink } from './ForgeLink';

jest.mock('@forge/bridge', () => ({
  router: {
    navigate: jest.fn(),
    open: jest.fn(),
  },
}));

describe('ForgeLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct href and data-testid', () => {
    render(
      <ForgeLink to='/foo' testId='my-link'>
        Go!
      </ForgeLink>,
    );
    const link = screen.getByTestId('my-link');
    expect(link).toBeDefined();
  });

  it('calls router.navigate on click by default', () => {
    render(
      <ForgeLink to='/bar' testId='nav-link'>
        Nav
      </ForgeLink>,
    );
    const link = screen.getByTestId('nav-link');
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    jest.spyOn(clickEvent, 'preventDefault');
    link.dispatchEvent(clickEvent);

    expect(clickEvent.preventDefault).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith('/bar');
    expect(router.open).not.toHaveBeenCalled();
  });

  it('calls router.open on click if openInNewTab is true', () => {
    render(
      <ForgeLink to='/baz' testId='open-link' openInNewTab>
        Open
      </ForgeLink>,
    );
    const link = screen.getByTestId('open-link');
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    jest.spyOn(clickEvent, 'preventDefault');
    link.dispatchEvent(clickEvent);

    expect(clickEvent.preventDefault).toHaveBeenCalled();
    expect(router.open).toHaveBeenCalledWith('/baz');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('renders children', () => {
    render(
      <ForgeLink to='/child'>
        <span>ChildText</span>
      </ForgeLink>,
    );
    expect(screen.getByText('ChildText')).toBeDefined();
  });
});
