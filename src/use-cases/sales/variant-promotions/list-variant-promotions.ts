import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VariantPromotion } from '@/entities/sales/variant-promotion';
import { VariantPromotionsRepository } from '@/repositories/sales/variant-promotions-repository';

interface ListVariantPromotionsRequest {
  variantId?: string;
  activeOnly?: boolean;
}

interface ListVariantPromotionsResponse {
  promotions: VariantPromotion[];
}

export class ListVariantPromotionsUseCase {
  constructor(
    private variantPromotionsRepository: VariantPromotionsRepository,
  ) {}

  async execute(
    request: ListVariantPromotionsRequest,
  ): Promise<ListVariantPromotionsResponse> {
    const { variantId, activeOnly } = request;

    let promotions: VariantPromotion[];

    if (variantId && activeOnly) {
      promotions =
        await this.variantPromotionsRepository.findManyActiveByVariant(
          new UniqueEntityID(variantId),
        );
    } else if (variantId) {
      promotions = await this.variantPromotionsRepository.findManyByVariant(
        new UniqueEntityID(variantId),
      );
    } else if (activeOnly) {
      promotions = await this.variantPromotionsRepository.findManyActive();
    } else {
      promotions = [];
    }

    return { promotions };
  }
}
