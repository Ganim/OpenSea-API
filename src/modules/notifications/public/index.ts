/**
 * Public API of the notifications module.
 *
 * This is the ONLY entry point other modules may import from.
 * Deep imports into `application`, `infrastructure`, `dispatcher`,
 * `domain`, `http`, or `workers` are forbidden by ESLint config.
 */

export * from './types';
export * from './events';
export {
  notificationClient,
  getNotificationClient,
  setNotificationClient,
  type NotificationClient,
} from './client';
export {
  registerManifestInMemory,
  getRegisteredManifest,
  listRegisteredManifests,
  clearManifestRegistry,
  isCategoryDeclared,
} from './manifest-loader';
