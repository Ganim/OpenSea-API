import type {
  ContentGenerationRequest,
  GeneratedContent,
  ProductData,
  PromotionData,
} from '@/services/ai-content/content-generator';
import { ContentGenerator } from '@/services/ai-content/content-generator';
import type { AiRouter } from '@/services/ai-provider/ai-router';
import { makeListProductsUseCase } from '@/use-cases/stock/products/factories/make-list-products-use-case';
import { makeGetProductByIdUseCase } from '@/use-cases/stock/products/factories/make-get-product-by-id-use-case';
import { makeListVariantsByProductIdUseCase } from '@/use-cases/stock/variants/factories/make-list-variants-by-product-id-use-case';
import { makeGetVariantPromotionByIdUseCase } from '@/use-cases/sales/variant-promotions/factories/make-get-variant-promotion-by-id-use-case';

// ─── Request / Response ──────────────────────────────────────────────

export interface GenerateContentRequest {
  tenantId: string;
  userId: string;
  userPermissions: string[];
  type: ContentGenerationRequest['type'];
  context: ContentGenerationRequest['context'];
}

export interface GenerateContentResponse {
  content: GeneratedContent;
}

// ─── Use Case ────────────────────────────────────────────────────────

export class GenerateContentUseCase {
  private readonly contentGenerator: ContentGenerator;

  constructor(private readonly aiRouter: AiRouter) {
    this.contentGenerator = new ContentGenerator(aiRouter);
  }

  async execute(
    request: GenerateContentRequest,
  ): Promise<GenerateContentResponse> {
    const { tenantId, context } = request;

    // 1. Load product data
    const products = await this.loadProducts(
      tenantId,
      context.productIds,
      context.categoryId,
    );

    // 2. Load promotion data
    const promotion = context.promotionId
      ? await this.loadPromotion(context.promotionId)
      : null;

    // 3. Generate content using AI tier 3
    const generated = await this.contentGenerator.generate(
      request,
      products,
      promotion,
    );

    return { content: generated };
  }

  private async loadProducts(
    tenantId: string,
    productIds?: string[],
    categoryId?: string,
  ): Promise<ProductData[]> {
    if (productIds && productIds.length > 0) {
      // Load specific products by ID
      const results = await Promise.all(
        productIds.slice(0, 10).map(async (id) => {
          try {
            const useCase = makeGetProductByIdUseCase();
            const result = await useCase.execute({ tenantId, id });
            const product = result.product;

            // Also load variants for richer content
            let variants: ProductData['variants'] = [];
            try {
              const variantsUseCase = makeListVariantsByProductIdUseCase();
              const variantsResult = await variantsUseCase.execute({
                tenantId,
                productId: id,
              });
              variants = variantsResult.variants.map((v) => ({
                name: v.variant.name,
                sku: v.variant.sku ?? '',
                price: v.variant.price,
              }));
            } catch {
              // Variants are optional for content generation
            }

            return {
              id: product.id.toString(),
              name: product.name,
              description: product.description,
              status: product.status.value,
              variants,
            } as ProductData;
          } catch {
            return null;
          }
        }),
      );

      return results.filter((p): p is ProductData => p !== null);
    }

    if (categoryId) {
      // Load products from a specific category
      const useCase = makeListProductsUseCase();
      const result = await useCase.execute({
        tenantId,
        categoryIds: [categoryId],
        page: 1,
        limit: 10,
      });

      return result.products.map((p) => ({
        id: p.id.toString(),
        name: p.name,
        description: p.description,
        status: p.status.value,
      }));
    }

    // If no specific products, load some active products
    const useCase = makeListProductsUseCase();
    const result = await useCase.execute({
      tenantId,
      page: 1,
      limit: 5,
    });

    return result.products.map((p) => ({
      id: p.id.toString(),
      name: p.name,
      description: p.description,
      status: p.status.value,
    }));
  }

  private async loadPromotion(
    promotionId: string,
  ): Promise<PromotionData | null> {
    try {
      const useCase = makeGetVariantPromotionByIdUseCase();
      const result = await useCase.execute({ id: promotionId });
      const p = result.promotion;

      return {
        id: p.id.toString(),
        name: p.name,
        discountType: p.discountType,
        discountValue: p.discountValue,
        startDate: p.startDate.toISOString(),
        endDate: p.endDate.toISOString(),
        variantId: p.variantId.toString(),
        isCurrentlyValid: p.isCurrentlyValid,
      };
    } catch {
      return null;
    }
  }
}
