import { ToolRegistry } from './tool-registry';
import { getStockTools } from './modules/stock-tools';

let cached: ToolRegistry | null = null;

export function makeToolRegistry(): ToolRegistry {
  if (cached) return cached;

  const registry = new ToolRegistry();
  registry.registerMany(getStockTools());

  cached = registry;
  return registry;
}

export function clearToolRegistryCache(): void {
  cached = null;
}
