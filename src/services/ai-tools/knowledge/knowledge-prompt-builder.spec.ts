import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgePromptBuilder } from './knowledge-prompt-builder';
import { KnowledgeRegistry } from './knowledge-registry';
import type { ModuleKnowledge } from './module-knowledge.interface';

function makeModuleKnowledge(
  overrides: Partial<ModuleKnowledge> = {},
): ModuleKnowledge {
  return {
    module: overrides.module ?? 'stock',
    displayName: overrides.displayName ?? 'Estoque',
    description: overrides.description ?? 'Gestão de estoque e inventário',
    version: overrides.version ?? '1.0.0',
    entities: overrides.entities ?? [
      {
        name: 'Product',
        displayName: 'Produto',
        description: 'Um produto no catálogo',
        fields: [
          {
            name: 'name',
            displayName: 'Nome',
            type: 'string',
            required: true,
            description: 'Nome do produto',
          },
          {
            name: 'description',
            displayName: 'Descrição',
            type: 'string',
            required: false,
            description: 'Descrição do produto',
          },
        ],
        relationships: [],
        validations: ['Nome é obrigatório'],
      },
    ],
    workflows: overrides.workflows ?? [
      {
        name: 'stock_entry',
        displayName: 'Entrada de Estoque',
        description: 'Processo de entrada de mercadoria',
        steps: [
          {
            order: 1,
            name: 'Identificação',
            description: 'Identifica o produto',
            requiredData: ['productId'],
            autoActions: [],
            confirmActions: ['stock_register_entry'],
            nextSteps: [],
            errorHandling: 'Pergunte qual produto',
          },
        ],
        triggers: ['entrada de estoque', 'receber mercadoria'],
        outcomes: ['Estoque atualizado'],
      },
    ],
    rules: overrides.rules ?? [],
    decisionTrees: overrides.decisionTrees ?? [],
    dataRequirements: overrides.dataRequirements ?? [],
    dependencies: overrides.dependencies ?? [],
    commonQueries: overrides.commonQueries ?? [
      {
        intent: 'check_stock_level',
        examples: ['quanto tem em estoque'],
        strategy: 'Use stock_list_items com filtros',
        toolsNeeded: ['stock_list_items'],
      },
    ],
  };
}

describe('KnowledgePromptBuilder', () => {
  let builder: KnowledgePromptBuilder;

  beforeEach(() => {
    builder = new KnowledgePromptBuilder();
  });

  describe('buildPrompt()', () => {
    it('should generate non-empty output for modules with data', () => {
      const modules = [makeModuleKnowledge()];

      const result = builder.buildPrompt(modules);

      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty string for empty modules array', () => {
      const result = builder.buildPrompt([]);

      expect(result).toBe('');
    });

    it('should include entity names', () => {
      const modules = [makeModuleKnowledge()];

      const result = builder.buildPrompt(modules);

      expect(result).toContain('Produto');
      expect(result).toContain('Product');
    });

    it('should include workflow names', () => {
      const modules = [makeModuleKnowledge()];

      const result = builder.buildPrompt(modules);

      expect(result).toContain('Entrada de Estoque');
    });

    it('should respect maxChars truncation', () => {
      const modules = [makeModuleKnowledge()];

      const result = builder.buildPrompt(modules, { maxChars: 100 });

      expect(result.length).toBeLessThanOrEqual(100 + 50); // 50 chars for truncation marker
      expect(result).toContain(
        '[Conhecimento truncado por limite de contexto]',
      );
    });

    it('should not truncate when maxChars is 0 (unlimited)', () => {
      const modules = [makeModuleKnowledge()];

      const result = builder.buildPrompt(modules, { maxChars: 0 });

      expect(result).not.toContain(
        '[Conhecimento truncado por limite de contexto]',
      );
    });

    it('should include module displayName', () => {
      const modules = [makeModuleKnowledge({ displayName: 'Estoque' })];

      const result = builder.buildPrompt(modules);

      expect(result).toContain('Estoque');
    });

    it('should include behavior instructions', () => {
      const modules = [makeModuleKnowledge()];

      const result = builder.buildPrompt(modules);

      expect(result).toContain('Comportamento do Assistente');
    });
  });

  describe('buildContextualPrompt()', () => {
    it('should prioritize intent-matched modules', () => {
      const registry = new KnowledgeRegistry();
      registry.register(makeModuleKnowledge({ module: 'stock' }));
      registry.register(
        makeModuleKnowledge({
          module: 'finance',
          displayName: 'Financeiro',
          description: 'Gestão financeira',
          entities: [
            {
              name: 'Entry',
              displayName: 'Lançamento',
              description: 'Um lançamento financeiro',
              fields: [],
              relationships: [],
              validations: [],
            },
          ],
          workflows: [],
          commonQueries: [
            {
              intent: 'check_balance',
              examples: ['saldo da conta', 'verificar saldo'],
              strategy: 'Use finance_get_balance',
              toolsNeeded: ['finance_get_balance'],
            },
          ],
        }),
      );

      // User asks about stock - stock should be primary
      const result = registry.getModulesByIntent('quanto tem em estoque');

      expect(result[0]).toBe('stock');
    });

    it('should return empty for no accessible modules', () => {
      const registry = new KnowledgeRegistry();
      registry.register(makeModuleKnowledge({ module: 'stock' }));

      // User has no permissions
      const result = builder.buildContextualPrompt(registry, 'test', []);

      expect(result).toBe('');
    });

    it('should include content for accessible modules', () => {
      const registry = new KnowledgeRegistry();
      registry.register(makeModuleKnowledge({ module: 'stock' }));

      const result = builder.buildContextualPrompt(
        registry,
        'verificar estoque do produto',
        ['stock.products.access'],
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('Estoque');
    });

    it('should include behavior instructions', () => {
      const registry = new KnowledgeRegistry();
      registry.register(makeModuleKnowledge({ module: 'stock' }));

      const result = builder.buildContextualPrompt(
        registry,
        'listar produtos',
        ['stock.products.access'],
      );

      expect(result).toContain('Comportamento do Assistente');
    });

    it('should include query strategy section when matching queries found', () => {
      const registry = new KnowledgeRegistry();
      registry.register(makeModuleKnowledge({ module: 'stock' }));

      const result = builder.buildContextualPrompt(
        registry,
        'quanto tem em estoque',
        ['stock.products.access'],
      );

      expect(result).toContain('Estrategia Sugerida');
    });
  });
});
