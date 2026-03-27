import { DocsRegistry } from './docs-registry';
import { stockDocs } from './docs/stock';
import { financeDocs } from './docs/finance';
import { hrDocs } from './docs/hr';
import { salesDocs } from './docs/sales';
import { toolsDocs } from './docs/tools';

let cached: DocsRegistry | null = null;

/**
 * Creates and returns a singleton DocsRegistry with all
 * operational documentation loaded.
 */
export function makeDocsRegistry(): DocsRegistry {
  if (cached) return cached;

  const registry = new DocsRegistry();
  registry.registerMany([
    ...stockDocs,
    ...financeDocs,
    ...hrDocs,
    ...salesDocs,
    ...toolsDocs,
  ]);

  cached = registry;
  return registry;
}

export function clearDocsRegistryCache(): void {
  cached = null;
}
