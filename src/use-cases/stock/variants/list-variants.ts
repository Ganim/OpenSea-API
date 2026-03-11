import { Variant } from '@/entities/stock/variant';
import { VariantsRepository } from '@/repositories/stock/variants-repository';

export interface ListVariantsUseCaseInput {
  tenantId: string;
  page?: number;
  limit?: number;
}

export interface ListVariantsUseCaseOutput {
  variants: Variant[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListVariantsUseCase {
  constructor(private variantsRepository: VariantsRepository) {}

  async execute(input: ListVariantsUseCaseInput): Promise<ListVariantsUseCaseOutput> {
    const { tenantId } = input;
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;

    const result = await this.variantsRepository.findManyPaginated(
      tenantId,
      { page, limit },
    );

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
