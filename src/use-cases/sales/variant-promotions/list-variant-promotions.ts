import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  variantPromotionToDTO,
  type VariantPromotionDTO,
} from '@/mappers/sales/variant-promotion/variant-promotion-to-dto';
import { VariantPromotionsRepository } from '@/repositories/sales/variant-promotions-repository';

interface ListVariantPromotionsRequest {
  variantId?: string;
  activeOnly?: boolean;
}

interface ListVariantPromotionsResponse {
  promotions: VariantPromotionDTO[];
}

export class ListVariantPromotionsUseCase {
  constructor(
    private variantPromotionsRepository: VariantPromotionsRepository,
  ) {}

  async execute(
    request: ListVariantPromotionsRequest,
  ): Promise<ListVariantPromotionsResponse> {
    const { variantId, activeOnly } = request;

    let promotions: Awaited<
      ReturnType<VariantPromotionsRepository['findManyActiveByVariant']>
    >;

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

    return { promotions: promotions.map(variantPromotionToDTO) };
  }
}
