import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ComponentTypeIcon } from './main';

describe('ComponentTypeIcon', () => {
  it('renders an img with the correct src, alt, width, and height when iconUrl is provided', () => {
    render(<ComponentTypeIcon iconUrl='https://example.com/icon.png' />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/icon.png');
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('width', '24');
    expect(img).toHaveAttribute('height', '24');
  });

  it('renders nothing when iconUrl is not provided', () => {
    const { container } = render(<ComponentTypeIcon iconUrl={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when iconUrl is null', () => {
    const { container } = render(<ComponentTypeIcon iconUrl={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when iconUrl is an empty string', () => {
    const { container } = render(<ComponentTypeIcon iconUrl='' />);
    expect(container).toBeEmptyDOMElement();
  });
});
