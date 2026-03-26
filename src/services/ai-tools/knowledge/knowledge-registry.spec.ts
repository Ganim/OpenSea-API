import { describe, it, expect, beforeEach } from 'vitest';
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
            description: 'Identifica o produto e variante',
            requiredData: ['productId', 'variantId'],
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
        examples: [
          'quanto tem em estoque',
          'verificar estoque',
          'quantos produtos',
        ],
        strategy: 'Use stock_list_items com filtros',
        toolsNeeded: ['stock_list_items'],
      },
    ],
  };
}

describe('KnowledgeRegistry', () => {
  let registry: KnowledgeRegistry;

  beforeEach(() => {
    registry = new KnowledgeRegistry();
  });

  it('register() should add a module', () => {
    const knowledge = makeModuleKnowledge({ module: 'stock' });

    registry.register(knowledge);

    expect(registry.getModule('stock')).toEqual(knowledge);
    expect(registry.getRegisteredModules()).toContain('stock');
  });

  it('getRelevantModules() should filter by user permissions', () => {
    registry.register(makeModuleKnowledge({ module: 'stock' }));
    registry.register(
      makeModuleKnowledge({ module: 'finance', displayName: 'Financeiro' }),
    );
    registry.register(makeModuleKnowledge({ module: 'hr', displayName: 'RH' }));

    const result = registry.getRelevantModules([
      'stock.products.access',
      'stock.items.access',
    ]);

    expect(result).toEqual(['stock']);
  });

  it('getRelevantModules() should return multiple modules when user has permissions across modules', () => {
    registry.register(makeModuleKnowledge({ module: 'stock' }));
    registry.register(
      makeModuleKnowledge({ module: 'finance', displayName: 'Financeiro' }),
    );

    const result = registry.getRelevantModules([
      'stock.products.access',
      'finance.entries.access',
    ]);

    expect(result).toContain('stock');
    expect(result).toContain('finance');
    expect(result).toHaveLength(2);
  });

  it('getModulesByIntent() should match keywords in user message', () => {
    registry.register(makeModuleKnowledge({ module: 'stock' }));

    const result = registry.getModulesByIntent('quanto tem em estoque');

    expect(result).toContain('stock');
  });

  it('getModulesByIntent() should match entity displayName', () => {
    registry.register(makeModuleKnowledge({ module: 'stock' }));

    const result = registry.getModulesByIntent(
      'quero ver informações do Produto',
    );

    expect(result).toContain('stock');
  });

  it('getModulesByIntent() should match module displayName', () => {
    registry.register(makeModuleKnowledge({ module: 'stock' }));

    const result = registry.getModulesByIntent('preciso acessar o Estoque');

    expect(result).toContain('stock');
  });

  it('getModulesByIntent() should return empty for unrelated message', () => {
    registry.register(makeModuleKnowledge({ module: 'stock' }));

    const result = registry.getModulesByIntent('olá, bom dia');

    expect(result).toHaveLength(0);
  });

  it('findMatchingQueries() should find common queries by intent', () => {
    registry.register(makeModuleKnowledge({ module: 'stock' }));

    const result = registry.findMatchingQueries('verificar estoque de um item');

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].module).toBe('stock');
    expect(result[0].query.intent).toBe('check_stock_level');
  });

  it('findMatchingQueries() should return empty for no match', () => {
    registry.register(makeModuleKnowledge({ module: 'stock' }));

    const result = registry.findMatchingQueries('olá mundo');

    expect(result).toHaveLength(0);
  });

  it('empty registry should return empty results', () => {
    expect(registry.getAllKnowledge()).toHaveLength(0);
    expect(registry.getRegisteredModules()).toHaveLength(0);
    expect(registry.getRelevantModules(['stock.products.access'])).toHaveLength(
      0,
    );
    expect(registry.getModulesByIntent('estoque')).toHaveLength(0);
    expect(registry.findMatchingQueries('estoque')).toHaveLength(0);
  });

  it('registerMany() should register multiple modules', () => {
    const modules = [
      makeModuleKnowledge({ module: 'stock' }),
      makeModuleKnowledge({ module: 'finance', displayName: 'Financeiro' }),
    ];

    registry.registerMany(modules);

    expect(registry.getRegisteredModules()).toHaveLength(2);
  });

  it('getModules() should return knowledge for requested module keys', () => {
    registry.register(makeModuleKnowledge({ module: 'stock' }));
    registry.register(
      makeModuleKnowledge({ module: 'finance', displayName: 'Financeiro' }),
    );
    registry.register(makeModuleKnowledge({ module: 'hr', displayName: 'RH' }));

    const result = registry.getModules(['stock', 'hr']);

    expect(result).toHaveLength(2);
    expect(result.map((m) => m.module)).toEqual(['stock', 'hr']);
  });

  it('getModules() should skip unknown module keys', () => {
    registry.register(makeModuleKnowledge({ module: 'stock' }));

    const result = registry.getModules(['stock', 'nonexistent']);

    expect(result).toHaveLength(1);
    expect(result[0].module).toBe('stock');
  });
});
