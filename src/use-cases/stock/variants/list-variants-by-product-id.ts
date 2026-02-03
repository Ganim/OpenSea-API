import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Variant } from '@/entities/stock/variant';
import { VariantsRepository } from '@/repositories/stock/variants-repository';

export interface VariantWithAggregations {
  variant: Variant;
  productCode: string | null;
  productName: string;
  itemCount: number;
  totalCurrentQuantity: number;
}

export interface ListVariantsByProductIdUseCaseInput {
  tenantId: string;
  productId: string;
}

export interface ListVariantsByProductIdUseCaseOutput {
  variants: VariantWithAggregations[];
}

export class ListVariantsByProductIdUseCase {
  constructor(private variantsRepository: VariantsRepository) {}

  async execute(
    input: ListVariantsByProductIdUseCaseInput,
  ): Promise<ListVariantsByProductIdUseCaseOutput> {
    const productId = new UniqueEntityID(input.productId);
    const variantsWithAggregations =
      await this.variantsRepository.findManyByProductWithAggregations(
        productId,
        input.tenantId,
      );

    return {
      variants: variantsWithAggregations,
    };
  }
}
