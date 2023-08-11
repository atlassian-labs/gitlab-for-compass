export const DESCRIPTION_TRUNCATION_LENGTH = 255;

export const truncateProjectNameString = (beforeString: string, projectName: string, afterString: string) => {
  // Spaces need to be included in `beforeString` and `afterString` so they can be considered in string length
  let truncatedProjectName = projectName;
  if (beforeString.length + projectName.length + afterString.length > DESCRIPTION_TRUNCATION_LENGTH) {
    const projectNameLen = DESCRIPTION_TRUNCATION_LENGTH - beforeString.length - afterString.length;
    truncatedProjectName = projectName.slice(0, projectNameLen);
  }
  return `${beforeString}${truncatedProjectName}${afterString}`;
};
