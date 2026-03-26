import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EsocialRubrica } from '@/entities/esocial/esocial-rubrica';
import { prisma } from '@/lib/prisma';
import type {
  CreateEsocialRubricaData,
  EsocialRubricasRepository,
  FindManyEsocialRubricasParams,
  FindManyEsocialRubricasResult,
  UpdateEsocialRubricaData,
} from '../esocial-rubricas-repository';

function typeNumberToString(type: number): string {
  switch (type) {
    case 1:
      return 'PROVENTO';
    case 2:
      return 'DESCONTO';
    case 3:
      return 'INFORMATIVA';
    default:
      return 'PROVENTO';
  }
}

function typeStringToNumber(type: string): number {
  switch (type) {
    case 'PROVENTO':
      return 1;
    case 'DESCONTO':
      return 2;
    case 'INFORMATIVA':
      return 3;
    default:
      return 1;
  }
}

function mapToDomain(data: any): EsocialRubrica {
  const incidence =
    typeof data.incidence === 'object' && data.incidence !== null
      ? data.incidence
      : {};

  return EsocialRubrica.create(
    {
      tenantId: new UniqueEntityID(data.tenantId),
      code: data.code,
      description: data.description,
      type: typeStringToNumber(data.type),
      incidInss: incidence.inss ?? undefined,
      incidIrrf: incidence.irrf ?? undefined,
      incidFgts: incidence.fgts ?? undefined,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    },
    new UniqueEntityID(data.id),
  );
}

export class PrismaEsocialRubricasRepository
  implements EsocialRubricasRepository
{
  async create(data: CreateEsocialRubricaData): Promise<EsocialRubrica> {
    const result = await prisma.esocialRubrica.create({
      data: {
        tenantId: data.tenantId,
        code: data.code,
        description: data.description,
        nature: '',
        type: typeNumberToString(data.type),
        incidence: {
          inss: data.incidInss ?? null,
          irrf: data.incidIrrf ?? null,
          fgts: data.incidFgts ?? null,
        },
        isActive: data.isActive ?? true,
      },
    });

    return mapToDomain(result);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<EsocialRubrica | null> {
    const data = await prisma.esocialRubrica.findFirst({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!data) return null;

    return mapToDomain(data);
  }

  async findByCode(
    code: string,
    tenantId: string,
  ): Promise<EsocialRubrica | null> {
    const data = await prisma.esocialRubrica.findUnique({
      where: {
        tenantId_code: { tenantId, code },
      },
    });

    if (!data) return null;

    return mapToDomain(data);
  }

  async findMany(
    params: FindManyEsocialRubricasParams,
  ): Promise<FindManyEsocialRubricasResult> {
    const { tenantId, page = 1, perPage = 20 } = params;

    const where: any = { tenantId };

    if (params.type !== undefined) {
      where.type = typeNumberToString(params.type);
    }
    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [rubricas, total] = await Promise.all([
      prisma.esocialRubrica.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { code: 'asc' },
      }),
      prisma.esocialRubrica.count({ where }),
    ]);

    return {
      rubricas: rubricas.map(mapToDomain),
      total,
    };
  }

  async update(
    id: UniqueEntityID,
    data: UpdateEsocialRubricaData,
  ): Promise<EsocialRubrica | null> {
    const updateData: any = {};

    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.type !== undefined)
      updateData.type = typeNumberToString(data.type);
    if (
      data.incidInss !== undefined ||
      data.incidIrrf !== undefined ||
      data.incidFgts !== undefined
    ) {
      // Merge incidence updates
      const existing = await prisma.esocialRubrica.findUnique({
        where: { id: id.toString() },
        select: { incidence: true },
      });
      const currentIncidence =
        typeof existing?.incidence === 'object' && existing.incidence !== null
          ? (existing.incidence as Record<string, unknown>)
          : {};
      updateData.incidence = {
        ...currentIncidence,
        ...(data.incidInss !== undefined && { inss: data.incidInss }),
        ...(data.incidIrrf !== undefined && { irrf: data.incidIrrf }),
        ...(data.incidFgts !== undefined && { fgts: data.incidFgts }),
      };
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const result = await prisma.esocialRubrica.update({
      where: { id: id.toString() },
      data: updateData,
    });

    return mapToDomain(result);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.esocialRubrica.delete({
      where: { id: id.toString() },
    });
  }
}
