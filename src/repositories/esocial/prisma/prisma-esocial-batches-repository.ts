import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  EsocialBatch,
  EsocialBatchStatus,
} from '@/entities/esocial/esocial-batch';
import { prisma } from '@/lib/prisma';
import type {
  CreateEsocialBatchData,
  EsocialBatchesRepository,
  FindManyEsocialBatchesParams,
  FindManyEsocialBatchesResult,
} from '../esocial-batches-repository';

function mapToDomain(data: any): EsocialBatch {
  return EsocialBatch.create(
    {
      tenantId: new UniqueEntityID(data.tenantId),
      status: data.status as EsocialBatchStatus,
      eventCount: data.totalEvents ?? 0,
      protocol: data.protocol ?? undefined,
      transmittedAt: data.transmittedAt ?? undefined,
      completedAt: data.checkedAt ?? undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    },
    new UniqueEntityID(data.id),
  );
}

export class PrismaEsocialBatchesRepository
  implements EsocialBatchesRepository
{
  async create(data: CreateEsocialBatchData): Promise<EsocialBatch> {
    const statusValue = (data.status as string) ?? 'PENDING';

    const result = await prisma.esocialBatch.create({
      data: {
        tenantId: data.tenantId,
        totalEvents: data.eventCount,
        status: statusValue as any,
        environment: 'HOMOLOGACAO',
      },
    });

    return mapToDomain(result);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<EsocialBatch | null> {
    const data = await prisma.esocialBatch.findFirst({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!data) return null;

    return mapToDomain(data);
  }

  async findMany(
    params: FindManyEsocialBatchesParams,
  ): Promise<FindManyEsocialBatchesResult> {
    const { tenantId, page = 1, perPage = 20 } = params;

    const where: any = { tenantId };

    if (params.status) {
      where.status = params.status;
    }

    const [batches, total] = await Promise.all([
      prisma.esocialBatch.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.esocialBatch.count({ where }),
    ]);

    return {
      batches: batches.map(mapToDomain),
      total,
    };
  }

  async save(batch: EsocialBatch): Promise<void> {
    await prisma.esocialBatch.update({
      where: { id: batch.id.toString() },
      data: {
        status: batch.status as any,
        protocol: batch.protocol,
        transmittedAt: batch.transmittedAt,
        checkedAt: batch.completedAt,
      },
    });
  }
}
