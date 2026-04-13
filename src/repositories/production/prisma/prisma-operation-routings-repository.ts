import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionOperationRouting } from '@/entities/production/operation-routing';
import { prisma } from '@/lib/prisma';
import type {
  OperationRoutingsRepository,
  CreateOperationRoutingSchema,
  UpdateOperationRoutingSchema,
} from '../operation-routings-repository';

function toDomain(raw: {
  id: string;
  tenantId: string;
  bomId: string;
  workstationId: string | null;
  sequence: number;
  operationName: string;
  description: string | null;
  setupTime: number;
  executionTime: number;
  waitTime: number;
  moveTime: number;
  isQualityCheck: boolean;
  isOptional: boolean;
  skillRequired: string | null;
  instructions: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ProductionOperationRouting {
  return ProductionOperationRouting.create(
    {
      tenantId: new EntityID(raw.tenantId),
      bomId: new EntityID(raw.bomId),
      workstationId: raw.workstationId
        ? new EntityID(raw.workstationId)
        : null,
      sequence: raw.sequence,
      operationName: raw.operationName,
      description: raw.description ?? null,
      setupTime: raw.setupTime,
      executionTime: raw.executionTime,
      waitTime: raw.waitTime,
      moveTime: raw.moveTime,
      isQualityCheck: raw.isQualityCheck,
      isOptional: raw.isOptional,
      skillRequired: raw.skillRequired ?? null,
      instructions: raw.instructions ?? null,
      imageUrl: raw.imageUrl ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new EntityID(raw.id),
  );
}

export class PrismaOperationRoutingsRepository
  implements OperationRoutingsRepository
{
  async create(
    data: CreateOperationRoutingSchema,
  ): Promise<ProductionOperationRouting> {
    const raw = await prisma.productionOperationRouting.create({
      data: {
        tenantId: data.tenantId,
        bomId: data.bomId,
        workstationId: data.workstationId ?? null,
        sequence: data.sequence,
        operationName: data.operationName,
        description: data.description ?? null,
        setupTime: data.setupTime,
        executionTime: data.executionTime,
        waitTime: data.waitTime,
        moveTime: data.moveTime,
        isQualityCheck: data.isQualityCheck ?? false,
        isOptional: data.isOptional ?? false,
        skillRequired: data.skillRequired ?? null,
        instructions: data.instructions ?? null,
        imageUrl: data.imageUrl ?? null,
      },
    });

    return toDomain(raw);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionOperationRouting | null> {
    const raw = await prisma.productionOperationRouting.findUnique({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!raw) {
      return null;
    }

    return toDomain(raw);
  }

  async findMany(tenantId: string): Promise<ProductionOperationRouting[]> {
    const records = await prisma.productionOperationRouting.findMany({
      where: { tenantId },
      orderBy: { sequence: 'asc' },
    });

    return records.map(toDomain);
  }

  async findManyByBomId(
    bomId: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionOperationRouting[]> {
    const records = await prisma.productionOperationRouting.findMany({
      where: {
        bomId: bomId.toString(),
        tenantId,
      },
      orderBy: { sequence: 'asc' },
    });

    return records.map(toDomain);
  }

  async update(
    data: UpdateOperationRoutingSchema,
  ): Promise<ProductionOperationRouting | null> {
    const updateData: {
      bomId?: string;
      workstationId?: string | null;
      sequence?: number;
      operationName?: string;
      description?: string | null;
      setupTime?: number;
      executionTime?: number;
      waitTime?: number;
      moveTime?: number;
      isQualityCheck?: boolean;
      isOptional?: boolean;
      skillRequired?: string | null;
      instructions?: string | null;
      imageUrl?: string | null;
    } = {};

    if (data.bomId !== undefined) updateData.bomId = data.bomId;
    if (data.workstationId !== undefined)
      updateData.workstationId = data.workstationId;
    if (data.sequence !== undefined) updateData.sequence = data.sequence;
    if (data.operationName !== undefined)
      updateData.operationName = data.operationName;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.setupTime !== undefined) updateData.setupTime = data.setupTime;
    if (data.executionTime !== undefined)
      updateData.executionTime = data.executionTime;
    if (data.waitTime !== undefined) updateData.waitTime = data.waitTime;
    if (data.moveTime !== undefined) updateData.moveTime = data.moveTime;
    if (data.isQualityCheck !== undefined)
      updateData.isQualityCheck = data.isQualityCheck;
    if (data.isOptional !== undefined) updateData.isOptional = data.isOptional;
    if (data.skillRequired !== undefined)
      updateData.skillRequired = data.skillRequired;
    if (data.instructions !== undefined)
      updateData.instructions = data.instructions;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

    const raw = await prisma.productionOperationRouting.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return toDomain(raw);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.productionOperationRouting.delete({
      where: { id: id.toString() },
    });
  }
}
