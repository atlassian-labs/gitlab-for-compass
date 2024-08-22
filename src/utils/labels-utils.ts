import { IMPORT_LABEL } from '../constants';

// Converts the topics from a GitLab project to a list of formatted labels for a Compass component.
export const formatLabels = (labels: string[]): string[] => {
  return labels.map((label) => {
    const transformedLabel = label.split(' ').join('-').toLowerCase();
    return transformedLabel.length > 40 ? transformedLabel.slice(0, 40) : transformedLabel;
  });
};

// Helper function to merge the project labels with the current labels
export function mergeLabels(projectLabels: string[], currentLabels: string[]): string[] {
  const formattedLabels = formatLabels(projectLabels);
  const labels = currentLabels ? [...currentLabels, ...formattedLabels] : formattedLabels;

  // Deduplicate and sort the labels for consistency
  const uniqueLabels = Array.from(new Set(labels));
  uniqueLabels.sort();

  // Get up to 20 labels
  let trimmedLabels = uniqueLabels.slice(0, 20);

  // If trimmedLabels doesn't include IMPORT_LABEL, add it to the trimmed labels
  if (!trimmedLabels.includes(IMPORT_LABEL)) {
    trimmedLabels = [IMPORT_LABEL, ...trimmedLabels].slice(0, 20);
  }

  return trimmedLabels;
}
