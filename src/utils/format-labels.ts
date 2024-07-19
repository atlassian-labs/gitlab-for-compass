// Converts the topics from a GitLab project to a list of formatted labels for a Compass component.
export const formatLabels = (labels: string[]): string[] => {
  return labels.map((label) => {
    const transformedLabel = label.split(' ').join('-').toLowerCase();
    return transformedLabel.length > 40 ? transformedLabel.slice(0, 40) : transformedLabel;
  });
};
