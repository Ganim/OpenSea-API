import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionMaterialReservation } from '@/entities/production/material-reservation';
import type { MaterialReservationStatus } from '@/entities/production/material-reservation';
import type {
  CreateMaterialReservationSchema,
  MaterialReservationsRepository,
  UpdateMaterialReservationSchema,
} from '../material-reservations-repository';

export class InMemoryMaterialReservationsRepository
  implements MaterialReservationsRepository
{
  public items: ProductionMaterialReservation[] = [];

  async create(
    data: CreateMaterialReservationSchema,
  ): Promise<ProductionMaterialReservation> {
    const reservation = ProductionMaterialReservation.create({
      productionOrderId: new EntityID(data.productionOrderId),
      materialId: new EntityID(data.materialId),
      warehouseId: new EntityID(data.warehouseId),
      quantityReserved: data.quantityReserved,
    });

    this.items.push(reservation);
    return reservation;
  }

  async findById(
    id: UniqueEntityID,
  ): Promise<ProductionMaterialReservation | null> {
    const item = this.items.find((i) => i.id.equals(id));
    return item ?? null;
  }

  async findManyByProductionOrderId(
    productionOrderId: UniqueEntityID,
  ): Promise<ProductionMaterialReservation[]> {
    return this.items.filter(
      (i) => i.productionOrderId.toString() === productionOrderId.toString(),
    );
  }

  async update(
    data: UpdateMaterialReservationSchema,
  ): Promise<ProductionMaterialReservation | null> {
    const item = this.items.find((i) => i.id.equals(data.id));
    if (!item) return null;

    if (data.quantityIssued !== undefined)
      item.quantityIssued = data.quantityIssued;
    if (data.status !== undefined)
      item.status = data.status as MaterialReservationStatus;

    return item;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
