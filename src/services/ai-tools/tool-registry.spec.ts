import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from './tool-registry';
import type { ToolDefinition } from './tool-types';

function makeToolDefinition(
  overrides: Partial<ToolDefinition> = {},
): ToolDefinition {
  return {
    name: overrides.name ?? 'test_tool',
    description: overrides.description ?? 'A test tool',
    parameters: overrides.parameters ?? {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
    module: overrides.module ?? 'stock',
    permission: overrides.permission ?? 'stock.products.access',
    requiresConfirmation: overrides.requiresConfirmation ?? false,
    category: overrides.category ?? 'query',
  };
}

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('register() should add a tool', () => {
    const tool = makeToolDefinition({ name: 'stock_list_products' });

    registry.register(tool);

    expect(registry.getTool('stock_list_products')).toEqual(tool);
    expect(registry.getAllTools()).toHaveLength(1);
  });

  it('registerMany() should add multiple tools', () => {
    const tools = [
      makeToolDefinition({ name: 'tool_a' }),
      makeToolDefinition({ name: 'tool_b' }),
      makeToolDefinition({ name: 'tool_c' }),
    ];

    registry.registerMany(tools);

    expect(registry.getAllTools()).toHaveLength(3);
    expect(registry.getTool('tool_a')).toBeDefined();
    expect(registry.getTool('tool_b')).toBeDefined();
    expect(registry.getTool('tool_c')).toBeDefined();
  });

  it('getToolsForUser() should filter by permissions', () => {
    registry.registerMany([
      makeToolDefinition({
        name: 'stock_list',
        permission: 'stock.products.access',
        category: 'query',
      }),
      makeToolDefinition({
        name: 'finance_list',
        permission: 'finance.entries.access',
        category: 'query',
      }),
      makeToolDefinition({
        name: 'hr_list',
        permission: 'hr.employees.access',
        category: 'query',
      }),
    ]);

    const result = registry.getToolsForUser(['stock.products.access']);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('stock_list');
  });

  it('getToolsForUser() should always include system tools', () => {
    registry.registerMany([
      makeToolDefinition({
        name: 'confirm_action',
        category: 'system',
        permission: '',
      }),
      makeToolDefinition({
        name: 'cancel_action',
        category: 'system',
        permission: '',
      }),
      makeToolDefinition({
        name: 'stock_list',
        permission: 'stock.products.access',
        category: 'query',
      }),
    ]);

    const result = registry.getToolsForUser([]);

    expect(result).toHaveLength(2);
    expect(result.map((t) => t.name)).toContain('confirm_action');
    expect(result.map((t) => t.name)).toContain('cancel_action');
  });

  it('getToolsForUser() should return empty for user with no matching permissions when no system tools exist', () => {
    registry.registerMany([
      makeToolDefinition({
        name: 'stock_list',
        permission: 'stock.products.access',
        category: 'query',
      }),
      makeToolDefinition({
        name: 'finance_list',
        permission: 'finance.entries.access',
        category: 'query',
      }),
    ]);

    const result = registry.getToolsForUser(['hr.employees.access']);

    expect(result).toHaveLength(0);
  });

  it('toProviderFormat() should convert tools correctly', () => {
    const tools = [
      makeToolDefinition({
        name: 'stock_create_product',
        description: 'Create a product',
        parameters: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
        module: 'stock',
        permission: 'stock.products.register',
        requiresConfirmation: true,
        category: 'action',
      }),
    ];

    const result = registry.toProviderFormat(tools);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'stock_create_product',
      description: 'Create a product',
      parameters: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
    });
    // Should NOT include metadata fields
    expect(result[0]).not.toHaveProperty('module');
    expect(result[0]).not.toHaveProperty('permission');
    expect(result[0]).not.toHaveProperty('requiresConfirmation');
    expect(result[0]).not.toHaveProperty('category');
  });

  it('getToolsByModule() should return tools for a specific module', () => {
    registry.registerMany([
      makeToolDefinition({ name: 'stock_a', module: 'stock' }),
      makeToolDefinition({ name: 'stock_b', module: 'stock' }),
      makeToolDefinition({ name: 'finance_a', module: 'finance' }),
    ]);

    const stockTools = registry.getToolsByModule('stock');

    expect(stockTools).toHaveLength(2);
    expect(stockTools.every((t) => t.module === 'stock')).toBe(true);
  });

  it('getTool() should return undefined for unknown tool', () => {
    expect(registry.getTool('nonexistent')).toBeUndefined();
  });
});
