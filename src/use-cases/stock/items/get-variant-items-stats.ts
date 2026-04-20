import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  ItemsRepository,
  VariantItemsStats,
} from '@/repositories/stock/items-repository';

interface GetVariantItemsStatsUseCaseRequest {
  tenantId: string;
  variantId: string;
}

type GetVariantItemsStatsUseCaseResponse = VariantItemsStats;

export class GetVariantItemsStatsUseCase {
  constructor(private itemsRepository: ItemsRepository) {}

  async execute(
    input: GetVariantItemsStatsUseCaseRequest,
  ): Promise<GetVariantItemsStatsUseCaseResponse> {
    return this.itemsRepository.getStatsByVariant(
      new UniqueEntityID(input.variantId),
      input.tenantId,
    );
  }
}
