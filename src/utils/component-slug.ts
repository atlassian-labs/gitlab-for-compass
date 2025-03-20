export const convertToCompassSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace all non-alphanumeric characters with a hyphen
    .replace(/^-+/, '') // remove leading hyphens
    .replace(/-+$/, '') // remove trailing hyphens
    .substring(0, 64); // limit to 64 characters
};
