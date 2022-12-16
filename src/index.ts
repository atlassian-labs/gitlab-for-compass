import resolver from './resolvers';
import { processGitlabEvent } from './entry/webtriggers';
import { dataProvider } from './entry/data-provider';
import { callback } from './entry/data-provider/callback';
import preUninstall from './entry/extension-points/pre-uninstall';
import { configValidator } from './entry/config-validator';

// extension points
export { preUninstall };
// webtriggers
export { processGitlabEvent };
// resolvers
export { resolver };
// dataProvider
export { dataProvider, callback };
// configValidator
export { configValidator };
