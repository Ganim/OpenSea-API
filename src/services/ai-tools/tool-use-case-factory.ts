import type { ToolHandler } from './tool-types';
import { getStockHandlers } from './modules/stock-handlers';
import { getSystemHandlers } from './modules/system-handlers';

export class ToolUseCaseFactory {
  private handlers: Map<string, ToolHandler> = new Map();

  constructor() {
    for (const [name, handler] of Object.entries(getStockHandlers())) {
      this.handlers.set(name, handler);
    }
    for (const [name, handler] of Object.entries(getSystemHandlers())) {
      this.handlers.set(name, handler);
    }
  }

  getHandler(toolName: string): ToolHandler | undefined {
    return this.handlers.get(toolName);
  }

  hasHandler(toolName: string): boolean {
    return this.handlers.has(toolName);
  }

  get registeredTools(): string[] {
    return Array.from(this.handlers.keys());
  }
}
