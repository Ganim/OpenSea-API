import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemsRepository } from '@/repositories/stock/items-repository';

interface GetItemByIdUseCaseRequest {
  id: string;
}

interface GetItemByIdUseCaseResponse {
  item: {
    id: string;
    uniqueCode: string;
    initialQuantity: number;
    currentQuantity: number;
    status: string;
    variantId: string;
    locationId: string;
    entryDate: Date;
    batchNumber: string | null;
    manufacturingDate: Date | null;
    expiryDate: Date | null;
    attributes: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  };
}

export class GetItemByIdUseCase {
  constructor(private itemsRepository: ItemsRepository) {}

  async execute(
    input: GetItemByIdUseCaseRequest,
  ): Promise<GetItemByIdUseCaseResponse> {
    const item = await this.itemsRepository.findById(
      new UniqueEntityID(input.id),
    );

    if (!item) {
      throw new ResourceNotFoundError('Item not found.');
    }

    return {
      item: {
        id: item.id.toString(),
        uniqueCode: item.uniqueCode,
        initialQuantity: item.initialQuantity,
        currentQuantity: item.currentQuantity,
        status: item.status.value,
        variantId: item.variantId.toString(),
        locationId: item.locationId.toString(),
        entryDate: item.entryDate,
        batchNumber: item.batchNumber ?? null,
        manufacturingDate: item.manufacturingDate ?? null,
        expiryDate: item.expiryDate ?? null,
        attributes: item.attributes,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt ?? item.createdAt,
      },
    };
  }
}
