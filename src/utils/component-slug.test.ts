import { convertToCompassSlug } from './component-slug';

describe('createComponentSlug', () => {
  it('returns a slug for a simple component name', () => {
    const result = convertToCompassSlug('MyComponent');
    expect(result).toBe('mycomponent');
  });

  it('returns a slug for a component name with spaces', () => {
    const result = convertToCompassSlug('My Component');
    expect(result).toBe('my-component');
  });

  it('returns a slug for a component name with special characters', () => {
    const result = convertToCompassSlug('My@Component!');
    expect(result).toBe('my-component');
  });

  it('returns a slug for a component name with numbers', () => {
    const result = convertToCompassSlug('Component123');
    expect(result).toBe('component123');
  });

  it('returns a slug for a component name with leading and trailing characters', () => {
    const result = convertToCompassSlug('*My-Component$');
    expect(result).toBe('my-component');
  });

  it('returns a slug truncated to 64 characters if the component name is too long', () => {
    const longName = 'a'.repeat(70);
    const result = convertToCompassSlug(longName);
    expect(result.length).toBe(64);
  });
});
