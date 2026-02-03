import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VariantsRepository } from '@/repositories/stock/variants-repository';

export interface DeleteVariantUseCaseInput {
  tenantId: string;
  id: string;
}

export class DeleteVariantUseCase {
  constructor(private variantsRepository: VariantsRepository) {}

  async execute(input: DeleteVariantUseCaseInput): Promise<void> {
    const variantId = new UniqueEntityID(input.id);
    const variant = await this.variantsRepository.findById(
      variantId,
      input.tenantId,
    );

    if (!variant) {
      throw new ResourceNotFoundError('Variant not found');
    }

    await this.variantsRepository.delete(variantId);
  }
}
