export enum ApplicationState {
  AUTH = '/auth',
  CONNECTED = '/connected',
}

export const ROUTES = {
  [ApplicationState.AUTH]: {
    path: ApplicationState.AUTH,
  },
  [ApplicationState.CONNECTED]: {
    path: ApplicationState.CONNECTED,
  },
  Import: {
    path: `${ApplicationState.CONNECTED}/import`,
  },
  ImportProgress: {
    path: `${ApplicationState.CONNECTED}/progress`,
  },
};
