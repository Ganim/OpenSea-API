import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VariantPromotion } from '@/entities/sales/variant-promotion';
import { VariantPromotionsRepository } from '@/repositories/sales/variant-promotions-repository';

interface GetVariantPromotionByIdRequest {
  id: string;
}

interface GetVariantPromotionByIdResponse {
  promotion: VariantPromotion;
}

export class GetVariantPromotionByIdUseCase {
  constructor(
    private variantPromotionsRepository: VariantPromotionsRepository,
  ) {}

  async execute(
    request: GetVariantPromotionByIdRequest,
  ): Promise<GetVariantPromotionByIdResponse> {
    const { id } = request;

    const promotion = await this.variantPromotionsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!promotion) {
      throw new ResourceNotFoundError('Promotion not found');
    }

    return { promotion };
  }
}
