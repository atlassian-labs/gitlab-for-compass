export const formatLastSyncTime = (lastSyncTime: string): string => {
  return `${new Date(lastSyncTime).toLocaleDateString('en-US')} ${new Date(lastSyncTime).toLocaleTimeString('en-US')}`;
};
