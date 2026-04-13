import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionWorkstation } from '@/entities/production/workstation';
import { prisma } from '@/lib/prisma';
import type {
  WorkstationsRepository,
  CreateWorkstationSchema,
  UpdateWorkstationSchema,
} from '../workstations-repository';

export class PrismaWorkstationsRepository implements WorkstationsRepository {
  async create(data: CreateWorkstationSchema): Promise<ProductionWorkstation> {
    const raw = await prisma.productionWorkstation.create({
      data: {
        tenantId: data.tenantId,
        workstationTypeId: data.workstationTypeId,
        workCenterId: data.workCenterId ?? null,
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        capacityPerDay: data.capacityPerDay,
        costPerHour: data.costPerHour ?? null,
        setupTimeDefault: data.setupTimeDefault,
        isActive: data.isActive ?? true,
        metadata: data.metadata ?? null,
      },
    });

    return ProductionWorkstation.create(
      {
        tenantId: new EntityID(raw.tenantId),
        workstationTypeId: new EntityID(raw.workstationTypeId),
        workCenterId: raw.workCenterId ? new EntityID(raw.workCenterId) : null,
        code: raw.code,
        name: raw.name,
        description: raw.description ?? null,
        capacityPerDay: raw.capacityPerDay,
        costPerHour: raw.costPerHour ? Number(raw.costPerHour) : null,
        setupTimeDefault: raw.setupTimeDefault,
        isActive: raw.isActive,
        metadata: raw.metadata as Record<string, unknown> | null,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new EntityID(raw.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionWorkstation | null> {
    const raw = await prisma.productionWorkstation.findUnique({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!raw) {
      return null;
    }

    return ProductionWorkstation.create(
      {
        tenantId: new EntityID(raw.tenantId),
        workstationTypeId: new EntityID(raw.workstationTypeId),
        workCenterId: raw.workCenterId ? new EntityID(raw.workCenterId) : null,
        code: raw.code,
        name: raw.name,
        description: raw.description ?? null,
        capacityPerDay: raw.capacityPerDay,
        costPerHour: raw.costPerHour ? Number(raw.costPerHour) : null,
        setupTimeDefault: raw.setupTimeDefault,
        isActive: raw.isActive,
        metadata: raw.metadata as Record<string, unknown> | null,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new EntityID(raw.id),
    );
  }

  async findByCode(
    code: string,
    tenantId: string,
  ): Promise<ProductionWorkstation | null> {
    const raw = await prisma.productionWorkstation.findFirst({
      where: {
        code: { equals: code, mode: 'insensitive' },
        tenantId,
      },
    });

    if (!raw) {
      return null;
    }

    return ProductionWorkstation.create(
      {
        tenantId: new EntityID(raw.tenantId),
        workstationTypeId: new EntityID(raw.workstationTypeId),
        workCenterId: raw.workCenterId ? new EntityID(raw.workCenterId) : null,
        code: raw.code,
        name: raw.name,
        description: raw.description ?? null,
        capacityPerDay: raw.capacityPerDay,
        costPerHour: raw.costPerHour ? Number(raw.costPerHour) : null,
        setupTimeDefault: raw.setupTimeDefault,
        isActive: raw.isActive,
        metadata: raw.metadata as Record<string, unknown> | null,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new EntityID(raw.id),
    );
  }

  async findMany(tenantId: string): Promise<ProductionWorkstation[]> {
    const records = await prisma.productionWorkstation.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    return records.map((raw) =>
      ProductionWorkstation.create(
        {
          tenantId: new EntityID(raw.tenantId),
          workstationTypeId: new EntityID(raw.workstationTypeId),
          workCenterId: raw.workCenterId
            ? new EntityID(raw.workCenterId)
            : null,
          code: raw.code,
          name: raw.name,
          description: raw.description ?? null,
          capacityPerDay: raw.capacityPerDay,
          costPerHour: raw.costPerHour ? Number(raw.costPerHour) : null,
          setupTimeDefault: raw.setupTimeDefault,
          isActive: raw.isActive,
          metadata: raw.metadata as Record<string, unknown> | null,
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt,
        },
        new EntityID(raw.id),
      ),
    );
  }

  async findManyByWorkCenter(
    workCenterId: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionWorkstation[]> {
    const records = await prisma.productionWorkstation.findMany({
      where: {
        workCenterId: workCenterId.toString(),
        tenantId,
      },
      orderBy: { name: 'asc' },
    });

    return records.map((raw) =>
      ProductionWorkstation.create(
        {
          tenantId: new EntityID(raw.tenantId),
          workstationTypeId: new EntityID(raw.workstationTypeId),
          workCenterId: raw.workCenterId
            ? new EntityID(raw.workCenterId)
            : null,
          code: raw.code,
          name: raw.name,
          description: raw.description ?? null,
          capacityPerDay: raw.capacityPerDay,
          costPerHour: raw.costPerHour ? Number(raw.costPerHour) : null,
          setupTimeDefault: raw.setupTimeDefault,
          isActive: raw.isActive,
          metadata: raw.metadata as Record<string, unknown> | null,
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt,
        },
        new EntityID(raw.id),
      ),
    );
  }

  async update(
    data: UpdateWorkstationSchema,
  ): Promise<ProductionWorkstation | null> {
    const updateData: {
      workstationTypeId?: string;
      workCenterId?: string | null;
      code?: string;
      name?: string;
      description?: string | null;
      capacityPerDay?: number;
      costPerHour?: number | null;
      setupTimeDefault?: number;
      isActive?: boolean;
      metadata?: Record<string, unknown> | null;
    } = {};

    if (data.workstationTypeId !== undefined)
      updateData.workstationTypeId = data.workstationTypeId;
    if (data.workCenterId !== undefined)
      updateData.workCenterId = data.workCenterId;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.capacityPerDay !== undefined)
      updateData.capacityPerDay = data.capacityPerDay;
    if (data.costPerHour !== undefined)
      updateData.costPerHour = data.costPerHour;
    if (data.setupTimeDefault !== undefined)
      updateData.setupTimeDefault = data.setupTimeDefault;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const raw = await prisma.productionWorkstation.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return ProductionWorkstation.create(
      {
        tenantId: new EntityID(raw.tenantId),
        workstationTypeId: new EntityID(raw.workstationTypeId),
        workCenterId: raw.workCenterId ? new EntityID(raw.workCenterId) : null,
        code: raw.code,
        name: raw.name,
        description: raw.description ?? null,
        capacityPerDay: raw.capacityPerDay,
        costPerHour: raw.costPerHour ? Number(raw.costPerHour) : null,
        setupTimeDefault: raw.setupTimeDefault,
        isActive: raw.isActive,
        metadata: raw.metadata as Record<string, unknown> | null,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new EntityID(raw.id),
    );
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.productionWorkstation.delete({
      where: { id: id.toString() },
    });
  }
}
