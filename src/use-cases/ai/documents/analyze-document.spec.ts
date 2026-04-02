import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/services/ai-documents/pdf-extractor', () => ({
  truncateContent: vi.fn((c: string) => c),
}));

vi.mock(
  '@/use-cases/stock/products/factories/make-list-products-use-case',
  () => ({
    makeListProductsUseCase: vi.fn().mockReturnValue({
      execute: vi.fn().mockResolvedValue({ products: [], meta: { total: 0 } }),
    }),
  }),
);

vi.mock('@/use-cases/stock/items/factories/make-list-items-use-case', () => ({
  makeListItemsUseCase: vi.fn().mockReturnValue({
    execute: vi.fn().mockResolvedValue({ items: [] }),
  }),
}));

import { AnalyzeDocumentUseCase } from './analyze-document';
import type { AiRouter } from '@/services/ai-provider/ai-router';

describe('AnalyzeDocumentUseCase', () => {
  let sut: AnalyzeDocumentUseCase;
  let aiRouter: AiRouter;

  beforeEach(() => {
    aiRouter = {
      complete: vi.fn(),
      completeWithTools: vi.fn(),
      getAvailableTiers: vi.fn(),
    } as never;

    sut = new AnalyzeDocumentUseCase(aiRouter);
  });

  it('should analyze document and return structured result', async () => {
    vi.mocked(aiRouter.complete).mockResolvedValue({
      content: JSON.stringify({
        documentInfo: {
          type: 'PREGAO',
          title: 'Pregão Eletrônico 001/2026',
          organization: 'Prefeitura Municipal',
          openingDate: '2026-05-01',
          requirements: ['Certidão negativa'],
        },
        items: [
          {
            itemNumber: 1,
            description: 'Papel A4',
            quantity: 100,
            unit: 'CX',
          },
        ],
      }),
      model: 'claude-3',
      tokensInput: 100,
      tokensOutput: 200,
      latencyMs: 500,
      estimatedCost: 0.01,
      tier: 3,
    } as never);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userPermissions: [],
      content: 'Pregão Eletrônico 001/2026...',
    });

    expect(result.documentInfo.type).toBe('PREGAO');
    expect(result.items).toHaveLength(1);
    expect(result.stockMatch).toBeDefined();
    expect(result.summary).toContain('Pregão Eletrônico');
  });

  it('should throw if AI returns invalid JSON', async () => {
    vi.mocked(aiRouter.complete).mockResolvedValue({
      content: 'This is not JSON at all',
      model: 'claude-3',
      tokensInput: 100,
      tokensOutput: 200,
      latencyMs: 500,
      estimatedCost: 0.01,
      tier: 3,
    } as never);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        userPermissions: [],
        content: 'Some document content',
      }),
    ).rejects.toThrow('Falha ao interpretar a resposta da IA');
  });

  it('should strip markdown code fences from AI response', async () => {
    vi.mocked(aiRouter.complete).mockResolvedValue({
      content:
        '```json\n' +
        JSON.stringify({
          documentInfo: {
            type: 'COTACAO',
            title: 'Cotação 001',
            organization: 'Empresa X',
            requirements: [],
          },
          items: [],
        }) +
        '\n```',
      model: 'claude-3',
      tokensInput: 100,
      tokensOutput: 200,
      latencyMs: 500,
      estimatedCost: 0.01,
      tier: 3,
    } as never);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userPermissions: [],
      content: 'Cotação content',
    });

    expect(result.documentInfo.type).toBe('COTACAO');
  });
});
