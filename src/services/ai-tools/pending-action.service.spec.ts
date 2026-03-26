import { describe, it, expect } from 'vitest';
import {
  buildPendingAction,
  getToolDisplayName,
} from './pending-action.service';
import type { ToolDefinition, ToolCall } from './tool-types';

function makeToolCall(overrides: Partial<ToolCall> = {}): ToolCall {
  return {
    id: overrides.id ?? 'call-1',
    name: overrides.name ?? 'stock_create_product',
    arguments: overrides.arguments ?? {
      name: 'Camiseta Básica',
      sku: 'CAM-001',
    },
  };
}

function makeToolDefinition(
  overrides: Partial<ToolDefinition> = {},
): ToolDefinition {
  return {
    name: overrides.name ?? 'stock_create_product',
    description: overrides.description ?? 'Cadastrar um novo produto',
    parameters: overrides.parameters ?? {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    },
    module: overrides.module ?? 'stock',
    permission: overrides.permission ?? 'stock.products.register',
    requiresConfirmation: overrides.requiresConfirmation ?? true,
    category: overrides.category ?? 'action',
  };
}

describe('PendingActionService', () => {
  describe('buildPendingAction()', () => {
    it('should generate correct structure', () => {
      const toolCall = makeToolCall();
      const toolDef = makeToolDefinition();

      const result = buildPendingAction(toolCall, toolDef);

      expect(result.actionId).toBeDefined();
      expect(typeof result.actionId).toBe('string');
      expect(result.toolName).toBe('stock_create_product');
      expect(result.args).toEqual({
        name: 'Camiseta Básica',
        sku: 'CAM-001',
      });
      expect(result.renderData.type).toBe('ACTION_CARD');
      expect(result.renderData.status).toBe('PENDING');
      expect(result.renderData.toolName).toBe('stock_create_product');
    });

    it('should map module correctly', () => {
      const toolCall = makeToolCall({ name: 'finance_create_entry' });
      const toolDef = makeToolDefinition({
        name: 'finance_create_entry',
        module: 'finance',
      });

      const result = buildPendingAction(toolCall, toolDef);

      expect(result.module).toBe('finance');
      expect(result.renderData.module).toBe('finance');
    });

    it('should map entity type correctly from MODULE_ENTITY_MAP', () => {
      const toolCall = makeToolCall({ name: 'stock_create_product' });
      const toolDef = makeToolDefinition({ name: 'stock_create_product' });

      const result = buildPendingAction(toolCall, toolDef);

      expect(result.entityType).toBe('product');
    });

    it('should return "unknown" entity type for unmapped tools', () => {
      const toolCall = makeToolCall({ name: 'custom_unknown_tool' });
      const toolDef = makeToolDefinition({ name: 'custom_unknown_tool' });

      const result = buildPendingAction(toolCall, toolDef);

      expect(result.entityType).toBe('unknown');
    });

    it('should extract fields from args', () => {
      const toolCall = makeToolCall({
        arguments: {
          name: 'Camiseta',
          quantity: 10,
          price: 29.9,
          status: 'ACTIVE',
        },
      });
      const toolDef = makeToolDefinition();

      const result = buildPendingAction(toolCall, toolDef);

      const fieldLabels = result.renderData.fields.map((f) => f.label);
      expect(fieldLabels).toContain('Nome');
      expect(fieldLabels).toContain('Quantidade');
      expect(fieldLabels).toContain('Preço');
      expect(fieldLabels).toContain('Status');

      const qtyField = result.renderData.fields.find(
        (f) => f.label === 'Quantidade',
      );
      expect(qtyField?.type).toBe('number');
      expect(qtyField?.value).toBe('10');

      const priceField = result.renderData.fields.find(
        (f) => f.label === 'Preço',
      );
      expect(priceField?.type).toBe('currency');
    });

    it('should handle array fields as summary', () => {
      const toolCall = makeToolCall({
        arguments: { items: ['a', 'b', 'c'] },
      });
      const toolDef = makeToolDefinition();

      const result = buildPendingAction(toolCall, toolDef);

      const itemsField = result.renderData.fields.find(
        (f) => f.label === 'items',
      );
      expect(itemsField?.value).toBe('3 item(s)');
    });

    it('should handle object fields as truncated JSON', () => {
      const toolCall = makeToolCall({
        arguments: { config: { key: 'value' } },
      });
      const toolDef = makeToolDefinition();

      const result = buildPendingAction(toolCall, toolDef);

      const configField = result.renderData.fields.find(
        (f) => f.label === 'config',
      );
      expect(configField?.value).toContain('key');
      expect(configField?.type).toBe('text');
    });

    it('should skip null and undefined values in args', () => {
      const toolCall = makeToolCall({
        arguments: { name: 'Test', notes: null, extra: undefined },
      });
      const toolDef = makeToolDefinition();

      const result = buildPendingAction(toolCall, toolDef);

      const fieldLabels = result.renderData.fields.map((f) => f.label);
      expect(fieldLabels).toContain('Nome');
      expect(fieldLabels).not.toContain('Observações');
    });

    it('should use displayName from TOOL_DISPLAY_NAMES when available', () => {
      const toolCall = makeToolCall({ name: 'stock_create_product' });
      const toolDef = makeToolDefinition({
        name: 'stock_create_product',
        description: 'Fallback description',
      });

      const result = buildPendingAction(toolCall, toolDef);

      expect(result.renderData.displayName).toBe('Cadastrar Produto');
    });

    it('should fall back to tool description when no display name mapped', () => {
      const toolCall = makeToolCall({ name: 'custom_tool' });
      const toolDef = makeToolDefinition({
        name: 'custom_tool',
        description: 'Custom tool description',
      });

      const result = buildPendingAction(toolCall, toolDef);

      expect(result.renderData.displayName).toBe('Custom tool description');
    });
  });

  describe('getToolDisplayName()', () => {
    it('should return Portuguese name for known tools', () => {
      expect(getToolDisplayName('stock_create_product')).toBe(
        'Cadastrar Produto',
      );
      expect(getToolDisplayName('finance_create_entry')).toBe(
        'Criar Lançamento Financeiro',
      );
      expect(getToolDisplayName('hr_register_employee')).toBe(
        'Cadastrar Funcionário',
      );
      expect(getToolDisplayName('sales_create_order')).toBe(
        'Criar Pedido de Venda',
      );
    });

    it('should return tool name for unknown tools', () => {
      expect(getToolDisplayName('unknown_tool')).toBe('unknown_tool');
      expect(getToolDisplayName('custom_action')).toBe('custom_action');
    });
  });
});
