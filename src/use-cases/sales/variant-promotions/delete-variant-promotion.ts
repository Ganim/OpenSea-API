import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VariantPromotion } from '@/entities/sales/variant-promotion';
import { VariantPromotionsRepository } from '@/repositories/sales/variant-promotions-repository';

interface DeleteVariantPromotionRequest {
  id: string;
}

interface DeleteVariantPromotionResponse {
  promotion: VariantPromotion;
}

export class DeleteVariantPromotionUseCase {
  constructor(
    private variantPromotionsRepository: VariantPromotionsRepository,
  ) {}

  async execute(
    request: DeleteVariantPromotionRequest,
  ): Promise<DeleteVariantPromotionResponse> {
    const { id } = request;

    const promotion = await this.variantPromotionsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!promotion) {
      throw new ResourceNotFoundError('Promotion not found');
    }

    promotion.delete();
    await this.variantPromotionsRepository.save(promotion);

    return { promotion };
  }
}
