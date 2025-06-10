export const checkCaCFilename = (filename: string) =>
  filename.split('/').some((item) => item === 'compass.yml' || item === 'compass.yaml');
