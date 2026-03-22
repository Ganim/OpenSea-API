import type { ToolDefinition } from './tool-types';

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  registerMany(tools: ToolDefinition[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getToolsByModule(module: string): ToolDefinition[] {
    return this.getAllTools().filter((t) => t.module === module);
  }

  /**
   * Returns only tools the user has permission to use.
   * System tools (confirm/cancel/undo) always included.
   * Other tools excluded if user lacks the permission.
   */
  getToolsForUser(userPermissions: string[]): ToolDefinition[] {
    const permSet = new Set(userPermissions);
    return this.getAllTools().filter(
      (tool) => tool.category === 'system' || permSet.has(tool.permission),
    );
  }

  /**
   * Convert tool definitions to provider format (strips metadata).
   */
  toProviderFormat(tools: ToolDefinition[]): Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }> {
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }
}
