import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import type { ItemDTO } from '@/mappers/stock/item/item-to-dto';
import { itemToDTO } from '@/mappers/stock/item/item-to-dto';
import type {
  ItemsRepository,
  ItemWithRelationsDTO,
} from '@/repositories/stock/items-repository';

interface ListItemsUseCaseRequest {
  tenantId: string;
  variantId?: string;
  binId?: string;
  status?: string;
  batchNumber?: string;
  productId?: string;
}

interface ListItemsUseCaseResponse {
  items: ItemDTO[];
}

export class ListItemsUseCase {
  constructor(private itemsRepository: ItemsRepository) {}

  async execute(
    input: ListItemsUseCaseRequest,
  ): Promise<ListItemsUseCaseResponse> {
    const { tenantId } = input;
    let itemsWithRelations: ItemWithRelationsDTO[] = [];

    // Fetch items based on filters
    if (input.productId) {
      itemsWithRelations =
        await this.itemsRepository.findManyByProductWithRelations(
          new UniqueEntityID(input.productId),
          tenantId,
        );
    } else if (input.variantId) {
      itemsWithRelations =
        await this.itemsRepository.findManyByVariantWithRelations(
          new UniqueEntityID(input.variantId),
          tenantId,
        );
    } else if (input.binId) {
      itemsWithRelations =
        await this.itemsRepository.findManyByBinWithRelations(
          new UniqueEntityID(input.binId),
          tenantId,
        );
    } else if (input.status) {
      const items = await this.itemsRepository.findManyByStatus(
        ItemStatus.create(
          input.status as
            | 'AVAILABLE'
            | 'RESERVED'
            | 'IN_TRANSIT'
            | 'DAMAGED'
            | 'EXPIRED'
            | 'DISPOSED',
        ),
        tenantId,
      );
      itemsWithRelations = items.map((item) => ({
        item,
        relatedData: {
          productCode: null,
          productName: '',
          variantSku: '',
          variantName: '',
        },
      }));
    } else if (input.batchNumber) {
      const items = await this.itemsRepository.findManyByBatch(
        input.batchNumber,
        tenantId,
      );
      itemsWithRelations = items.map((item) => ({
        item,
        relatedData: {
          productCode: null,
          productName: '',
          variantSku: '',
          variantName: '',
        },
      }));
    } else {
      // If no filters, return all items with relations
      itemsWithRelations =
        await this.itemsRepository.findAllWithRelations(tenantId);
    }

    return {
      items: itemsWithRelations.map(({ item, relatedData }) =>
        itemToDTO(item, relatedData),
      ),
    };
  }
}
