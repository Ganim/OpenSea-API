import { ToolRegistry } from './tool-registry';
import { getStockTools } from './modules/stock-tools';
import { getSalesTools } from './modules/sales-tools';
import { getHrTools } from './modules/hr-tools';
import { getFinanceTools } from './modules/finance-tools';
import { getContentTools } from './modules/content-tools';

let cached: ToolRegistry | null = null;

export function makeToolRegistry(): ToolRegistry {
  if (cached) return cached;

  const registry = new ToolRegistry();
  registry.registerMany(getStockTools());
  registry.registerMany(getSalesTools());
  registry.registerMany(getHrTools());
  registry.registerMany(getFinanceTools());
  registry.registerMany(getContentTools());

  cached = registry;
  return registry;
}

export function clearToolRegistryCache(): void {
  cached = null;
}
