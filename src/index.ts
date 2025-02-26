import adminResolver from './resolvers/admin-resolvers';
import importResolver from './resolvers/import-resolvers';
import importQueueResolver from './resolvers/import-queue-resolver';

import { processGitlabEvent } from './entry/webtriggers';
import { dataProvider } from './entry/data-provider';
import { callback } from './entry/data-provider/callback';
import preUninstall from './entry/extension-points/pre-uninstall';
import { configValidator } from './entry/config-validator';
import { importRecentRepos } from './entry/import-recent-repos';
import { getRepoDetails } from './entry/get-repo-details';
import { getTreeShallow } from './entry/get-tree-shallow';
import { getFileContents } from './entry/get-file-contents';

// extension points
export { preUninstall };
// webtriggers
export { processGitlabEvent };
// resolvers
export { adminResolver, importResolver, importQueueResolver };
// dataProvider
export { dataProvider, callback };
// configValidator
export { configValidator };
// importRecentRepos
export { importRecentRepos };
// getRepoDetails
export { getRepoDetails };
// getTreeShallow
export { getTreeShallow };
// getFileContents
export { getFileContents };
