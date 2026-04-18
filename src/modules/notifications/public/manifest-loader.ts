/**
 * Manifest loader registry.
 *
 * Each business module (hr, sales, stock, finance, requests, calendar, ...)
 * publishes a `notifications.manifest.ts` file in its own folder.
 * At application startup, the boot sequence imports these manifests and
 * calls `registerManifest()` — the loader keeps them in an in-memory
 * registry AND persists them to `notification_categories` + `notification_module_registry`.
 *
 * Adding a new category to an existing module requires only editing its
 * manifest file. No changes to the notifications module are necessary.
 */

import type { ModuleNotificationManifest } from './types';

const registry = new Map<string, ModuleNotificationManifest>();

export function registerManifestInMemory(
  manifest: ModuleNotificationManifest,
): void {
  if (!manifest.module) {
    throw new Error('Notification manifest is missing the `module` field');
  }
  registry.set(manifest.module, manifest);
}

export function getRegisteredManifest(
  module: string,
): ModuleNotificationManifest | undefined {
  return registry.get(module);
}

export function listRegisteredManifests(): ModuleNotificationManifest[] {
  return Array.from(registry.values()).sort(
    (a, b) => (a.order ?? 100) - (b.order ?? 100),
  );
}

export function clearManifestRegistry(): void {
  registry.clear();
}
