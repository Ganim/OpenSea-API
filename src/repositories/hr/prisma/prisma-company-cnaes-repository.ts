import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CompanyCnae } from '@/entities/hr/company-cnae';
import { prisma } from '@/lib/prisma';
import { mapCompanyCnaePrismaToDomain } from '@/mappers/hr/company-cnae';
import type { Prisma } from '@prisma/client';
import type {
  CompanyAeRepository,
  CreateCompanyCnaeSchema,
  FindManyCnaesParams,
  FindManyCnaesResult,
} from '../company-cnaes-repository';

export class PrismaCompanyCnaesRepository implements CompanyAeRepository {
  async create(data: CreateCompanyCnaeSchema): Promise<CompanyCnae> {
    const created = await prisma.companyCnae.create({
      data: {
        companyId: data.companyId.toString(),
        code: data.code,
        description: data.description,
        isPrimary: data.isPrimary ?? false,
        status: data.status ?? 'ACTIVE',
        pendingIssues: data.pendingIssues ?? [],
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    return CompanyCnae.create(
      mapCompanyCnaePrismaToDomain(created),
      new UniqueEntityID(created.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    options?: { companyId?: UniqueEntityID; includeDeleted?: boolean },
  ): Promise<CompanyCnae | null> {
    const cnae = await prisma.companyCnae.findFirst({
      where: {
        id: id.toString(),
        ...(options?.companyId
          ? { companyId: options.companyId.toString() }
          : {}),
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
    });

    if (!cnae) return null;

    return CompanyCnae.create(
      mapCompanyCnaePrismaToDomain(cnae),
      new UniqueEntityID(cnae.id),
    );
  }

  async findByCompanyAndCode(
    companyId: UniqueEntityID,
    code: string,
    options?: { includeDeleted?: boolean },
  ): Promise<CompanyCnae | null> {
    const cnae = await prisma.companyCnae.findFirst({
      where: {
        companyId: companyId.toString(),
        code,
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
    });

    if (!cnae) return null;

    return CompanyCnae.create(
      mapCompanyCnaePrismaToDomain(cnae),
      new UniqueEntityID(cnae.id),
    );
  }

  async findPrimaryByCompany(
    companyId: UniqueEntityID,
  ): Promise<CompanyCnae | null> {
    const cnae = await prisma.companyCnae.findFirst({
      where: {
        companyId: companyId.toString(),
        isPrimary: true,
        deletedAt: null,
      },
    });

    if (!cnae) return null;

    return CompanyCnae.create(
      mapCompanyCnaePrismaToDomain(cnae),
      new UniqueEntityID(cnae.id),
    );
  }

  async findMany(params: FindManyCnaesParams): Promise<FindManyCnaesResult> {
    const where = {
      companyId: params.companyId.toString(),
      ...(params.code ? { code: params.code } : {}),
      ...(params.isPrimary !== undefined
        ? { isPrimary: params.isPrimary }
        : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.includeDeleted ? {} : { deletedAt: null }),
    };

    const [cnaes, total] = await Promise.all([
      prisma.companyCnae.findMany({
        where,
        skip: ((params.page ?? 1) - 1) * (params.perPage ?? 20),
        take: params.perPage ?? 20,
      }),
      prisma.companyCnae.count({ where }),
    ]);

    return {
      cnaes: cnaes.map((cnae) =>
        CompanyCnae.create(
          mapCompanyCnaePrismaToDomain(cnae),
          new UniqueEntityID(cnae.id),
        ),
      ),
      total,
    };
  }

  async save(cnae: CompanyCnae): Promise<void> {
    await prisma.companyCnae.update({
      where: { id: cnae.id.toString() },
      data: {
        code: cnae.code,
        description: cnae.description,
        isPrimary: cnae.isPrimary,
        status: cnae.status,
        pendingIssues: cnae.pendingIssues,
        metadata: cnae.metadata as Prisma.InputJsonValue,
        deletedAt: cnae.deletedAt ?? null,
        updatedAt: cnae.updatedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.companyCnae.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: UniqueEntityID): Promise<void> {
    await prisma.companyCnae.update({
      where: { id: id.toString() },
      data: { deletedAt: null },
    });
  }

  async unsetPrimaryForCompany(
    companyId: UniqueEntityID,
    exceptId?: UniqueEntityID,
  ): Promise<void> {
    await prisma.companyCnae.updateMany({
      where: {
        companyId: companyId.toString(),
        deletedAt: null,
        ...(exceptId ? { id: { not: exceptId.toString() } } : {}),
      },
      data: {
        isPrimary: false,
      },
    });
  }
}
