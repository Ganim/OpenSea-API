import { KnowledgeRegistry } from './knowledge-registry';
import { stockKnowledge } from './modules/stock-knowledge';
import { financeKnowledge } from './modules/finance-knowledge';
import { hrKnowledge } from './modules/hr-knowledge';
import { salesKnowledge } from './modules/sales-knowledge';

let cached: KnowledgeRegistry | null = null;

/**
 * Creates and returns a singleton KnowledgeRegistry with all
 * module knowledge manifests registered.
 */
export function makeKnowledgeRegistry(): KnowledgeRegistry {
  if (cached) return cached;

  const registry = new KnowledgeRegistry();

  registry.registerMany([
    stockKnowledge,
    financeKnowledge,
    hrKnowledge,
    salesKnowledge,
  ]);

  cached = registry;
  return registry;
}

export function clearKnowledgeRegistryCache(): void {
  cached = null;
}
