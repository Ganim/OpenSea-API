import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock factory functions that use Prisma
vi.mock(
  '@/use-cases/stock/products/factories/make-list-products-use-case',
  () => ({
    makeListProductsUseCase: vi.fn().mockReturnValue({
      execute: vi.fn().mockResolvedValue({ products: [], meta: { total: 0 } }),
    }),
  }),
);
vi.mock(
  '@/use-cases/stock/products/factories/make-get-product-by-id-use-case',
  () => ({
    makeGetProductByIdUseCase: vi.fn().mockReturnValue({
      execute: vi.fn(),
    }),
  }),
);
vi.mock(
  '@/use-cases/stock/variants/factories/make-list-variants-by-product-id-use-case',
  () => ({
    makeListVariantsByProductIdUseCase: vi.fn().mockReturnValue({
      execute: vi.fn(),
    }),
  }),
);
vi.mock(
  '@/use-cases/sales/variant-promotions/factories/make-get-variant-promotion-by-id-use-case',
  () => ({
    makeGetVariantPromotionByIdUseCase: vi.fn().mockReturnValue({
      execute: vi.fn(),
    }),
  }),
);

vi.mock('@/services/ai-content/content-generator', () => ({
  ContentGenerator: vi.fn().mockImplementation(() => ({
    generate: vi.fn().mockResolvedValue({
      title: 'Test Content',
      body: 'Generated body',
      hashtags: ['#test'],
    }),
  })),
}));

import { GenerateContentUseCase } from './generate-content';
import type { AiRouter } from '@/services/ai-provider/ai-router';

describe('GenerateContentUseCase', () => {
  let sut: GenerateContentUseCase;
  let aiRouter: AiRouter;

  beforeEach(() => {
    aiRouter = {
      complete: vi.fn(),
      completeWithTools: vi.fn(),
      getAvailableTiers: vi.fn(),
    } as never;

    sut = new GenerateContentUseCase(aiRouter);
  });

  it('should generate content for given context', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      userPermissions: ['stock.products.access'],
      type: 'SOCIAL_POST',
      context: {
        productIds: [],
        tone: 'professional',
        audience: 'business',
      },
    });

    expect(result.content).toBeDefined();
    expect(result.content.title).toBe('Test Content');
  });
});
