import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionMaterialReservation } from '@/entities/production/material-reservation';
import type { MaterialReservationStatus } from '@/entities/production/material-reservation';
import { prisma } from '@/lib/prisma';
import type {
  MaterialReservationsRepository,
  CreateMaterialReservationSchema,
  UpdateMaterialReservationSchema,
} from '../material-reservations-repository';

function toDomain(raw: {
  id: string;
  productionOrderId: string;
  materialId: string;
  warehouseId: string;
  quantityReserved: unknown;
  quantityIssued: unknown;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): ProductionMaterialReservation {
  return ProductionMaterialReservation.create(
    {
      productionOrderId: new EntityID(raw.productionOrderId),
      materialId: new EntityID(raw.materialId),
      warehouseId: new EntityID(raw.warehouseId),
      quantityReserved: Number(raw.quantityReserved),
      quantityIssued: Number(raw.quantityIssued),
      status: raw.status as MaterialReservationStatus,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new EntityID(raw.id),
  );
}

export class PrismaMaterialReservationsRepository
  implements MaterialReservationsRepository
{
  async create(
    data: CreateMaterialReservationSchema,
  ): Promise<ProductionMaterialReservation> {
    const raw = await prisma.productionMaterialReservation.create({
      data: {
        productionOrderId: data.productionOrderId,
        materialId: data.materialId,
        warehouseId: data.warehouseId,
        quantityReserved: data.quantityReserved,
      },
    });

    return toDomain(raw);
  }

  async findById(
    id: UniqueEntityID,
  ): Promise<ProductionMaterialReservation | null> {
    const raw = await prisma.productionMaterialReservation.findUnique({
      where: { id: id.toString() },
    });

    if (!raw) {
      return null;
    }

    return toDomain(raw);
  }

  async findManyByProductionOrderId(
    productionOrderId: UniqueEntityID,
  ): Promise<ProductionMaterialReservation[]> {
    const records = await prisma.productionMaterialReservation.findMany({
      where: { productionOrderId: productionOrderId.toString() },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(toDomain);
  }

  async update(
    data: UpdateMaterialReservationSchema,
  ): Promise<ProductionMaterialReservation | null> {
    const updateData: {
      quantityIssued?: number;
      status?: string;
    } = {};

    if (data.quantityIssued !== undefined)
      updateData.quantityIssued = data.quantityIssued;
    if (data.status !== undefined) updateData.status = data.status;

    const raw = await prisma.productionMaterialReservation.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return toDomain(raw);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.productionMaterialReservation.delete({
      where: { id: id.toString() },
    });
  }
}
