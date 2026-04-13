import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionMaterialReturn } from '@/entities/production/material-return';
import type {
  CreateMaterialReturnSchema,
  MaterialReturnsRepository,
} from '../material-returns-repository';

export class InMemoryMaterialReturnsRepository
  implements MaterialReturnsRepository
{
  public items: ProductionMaterialReturn[] = [];

  async create(
    data: CreateMaterialReturnSchema,
  ): Promise<ProductionMaterialReturn> {
    const materialReturn = ProductionMaterialReturn.create({
      productionOrderId: new EntityID(data.productionOrderId),
      materialId: new EntityID(data.materialId),
      warehouseId: new EntityID(data.warehouseId),
      quantity: data.quantity,
      reason: data.reason ?? null,
      returnedById: new EntityID(data.returnedById),
    });

    this.items.push(materialReturn);
    return materialReturn;
  }

  async findById(id: UniqueEntityID): Promise<ProductionMaterialReturn | null> {
    const item = this.items.find(
      (i) => i.materialReturnId.toString() === id.toString(),
    );
    return item ?? null;
  }

  async findManyByProductionOrderId(
    productionOrderId: UniqueEntityID,
  ): Promise<ProductionMaterialReturn[]> {
    return this.items.filter(
      (i) => i.productionOrderId.toString() === productionOrderId.toString(),
    );
  }
}
