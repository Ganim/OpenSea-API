import { describe, it, expect, beforeEach } from 'vitest';
import { DocsRegistry, type DocEntry } from './docs-registry';

const mockDoc = (overrides: Partial<DocEntry> = {}): DocEntry => ({
  module: 'stock',
  feature: 'create-product',
  type: 'guide',
  keywords: ['produto', 'criar', 'cadastrar'],
  requiredPermissions: ['stock.products.register'],
  navPath: 'Menu > Estoque > Produtos > Novo',
  title: 'Como Criar um Produto',
  content: 'Passo a passo para criar um produto...',
  ...overrides,
});

describe('DocsRegistry', () => {
  let registry: DocsRegistry;

  beforeEach(() => {
    registry = new DocsRegistry();
  });

  it('should register and retrieve docs', () => {
    registry.register(mockDoc());
    expect(registry.getAllDocs()).toHaveLength(1);
  });

  it('should register many docs at once', () => {
    registry.registerMany([mockDoc(), mockDoc({ feature: 'other' })]);
    expect(registry.getAllDocs()).toHaveLength(2);
  });

  it('should get docs by module', () => {
    registry.register(mockDoc());
    registry.register(
      mockDoc({
        module: 'finance',
        requiredPermissions: ['finance.entries.access'],
      }),
    );
    expect(registry.getDocsByModule('stock')).toHaveLength(1);
    expect(registry.getDocsByModule('finance')).toHaveLength(1);
  });

  it('should filter by permissions', () => {
    registry.register(mockDoc());
    registry.register(
      mockDoc({
        module: 'finance',
        requiredPermissions: ['finance.entries.access'],
        keywords: ['financeiro'],
      }),
    );

    const results = registry.findRelevantDocs(
      'como criar um produto',
      ['stock.products.register'], // no finance permission
    );

    expect(results.every((d) => d.module === 'stock')).toBe(true);
  });

  it('should score troubleshooting higher for problem messages', () => {
    registry.register(mockDoc({ type: 'guide', keywords: ['produto'] }));
    registry.register(
      mockDoc({
        type: 'troubleshooting',
        feature: 'product-not-showing',
        title: 'Produto nao aparece',
        keywords: ['produto', 'nao aparece'],
      }),
    );

    const results = registry.findRelevantDocs(
      'meu produto nao aparece, o que esta errado?',
      ['stock.products.register'],
    );

    expect(results[0].type).toBe('troubleshooting');
  });

  it('should score guides higher for how-to messages', () => {
    registry.register(
      mockDoc({ type: 'troubleshooting', keywords: ['produto'] }),
    );
    registry.register(
      mockDoc({ type: 'guide', keywords: ['produto', 'criar'] }),
    );

    const results = registry.findRelevantDocs(
      'como criar um produto no sistema?',
      ['stock.products.register'],
    );

    expect(results[0].type).toBe('guide');
  });

  it('should return empty for no matching permissions', () => {
    registry.register(mockDoc());
    const results = registry.findRelevantDocs('criar produto', []);
    expect(results).toHaveLength(0);
  });

  it('should limit results', () => {
    for (let i = 0; i < 10; i++) {
      registry.register(
        mockDoc({ feature: `feat-${i}`, keywords: ['produto'] }),
      );
    }
    const results = registry.findRelevantDocs(
      'produto',
      ['stock.products.register'],
      3,
    );
    expect(results).toHaveLength(3);
  });

  it('should return empty when no docs match the message', () => {
    registry.register(mockDoc());
    const results = registry.findRelevantDocs('xyz totalmente irrelevante', [
      'stock.products.register',
    ]);
    expect(results).toHaveLength(0);
  });

  it('should boost score for title match', () => {
    registry.register(
      mockDoc({
        title: 'Como Criar um Produto',
        keywords: [],
        feature: 'x',
      }),
    );
    registry.register(
      mockDoc({
        title: 'Outro Documento',
        keywords: ['produto'],
        feature: 'y',
      }),
    );

    const results = registry.findRelevantDocs('como criar um produto', [
      'stock.products.register',
    ]);

    expect(results[0].title).toBe('Como Criar um Produto');
  });
});
