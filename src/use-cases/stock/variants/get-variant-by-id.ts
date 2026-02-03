import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Variant } from '@/entities/stock/variant';
import { VariantsRepository } from '@/repositories/stock/variants-repository';

export interface GetVariantByIdUseCaseInput {
  tenantId: string;
  id: string;
}

export class GetVariantByIdUseCase {
  constructor(private variantsRepository: VariantsRepository) {}

  async execute(input: GetVariantByIdUseCaseInput): Promise<Variant> {
    const variantId = new UniqueEntityID(input.id);
    const variant = await this.variantsRepository.findById(
      variantId,
      input.tenantId,
    );

    if (!variant) {
      throw new ResourceNotFoundError('Variant not found');
    }

    return variant;
  }
}
