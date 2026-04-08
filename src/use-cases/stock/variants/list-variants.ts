import { Variant } from '@/entities/stock/variant';
import {
  VariantProductInfo,
  VariantsRepository,
} from '@/repositories/stock/variants-repository';

export interface ListVariantsUseCaseInput {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  barcode?: string;
  onlyActive?: boolean;
  includeProduct?: boolean;
}

export interface ListVariantsUseCaseOutput {
  variants: Variant[];
  /**
   * Present only when the caller sets `includeProduct: true`. Keyed by
   * variant id for fast lookup when building enriched DTOs.
   */
  productInfoById?: Record<string, VariantProductInfo>;
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListVariantsUseCase {
  constructor(private variantsRepository: VariantsRepository) {}

  async execute(
    input: ListVariantsUseCaseInput,
  ): Promise<ListVariantsUseCaseOutput> {
    const { tenantId } = input;
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;

    const hasFilters =
      input.search || input.categoryId || input.barcode || input.onlyActive;

    if (input.includeProduct) {
      const result =
        await this.variantsRepository.findManyFilteredWithProduct({
          tenantId,
          page,
          limit,
          search: input.search,
          categoryId: input.categoryId,
          barcode: input.barcode,
          onlyActive: input.onlyActive,
        });

      const variants: Variant[] = [];
      const productInfoById: Record<string, VariantProductInfo> = {};
      for (const row of result.data) {
        variants.push(row.variant);
        productInfoById[row.variant.id.toString()] = row.productInfo;
      }

      return {
        variants,
        productInfoById,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.totalPages,
        },
      };
    }

    if (hasFilters) {
      const result = await this.variantsRepository.findManyFiltered({
        tenantId,
        page,
        limit,
        search: input.search,
        categoryId: input.categoryId,
        barcode: input.barcode,
        onlyActive: input.onlyActive,
      });

      return {
        variants: result.data,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.totalPages,
        },
      };
    }

    const result = await this.variantsRepository.findManyPaginated(tenantId, {
      page,
      limit,
    });

    return {
      variants: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.totalPages,
      },
    };
  }
}
