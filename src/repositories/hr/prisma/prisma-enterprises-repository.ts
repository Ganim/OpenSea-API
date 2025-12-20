import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Enterprise } from '@/entities/hr/enterprise';
import { prisma } from '@/lib/prisma';
import { mapEnterprisePrismaToDomain } from '@/mappers/hr/enterprise/enterprise-prisma-to-domain';
import type {
  CreateEnterpriseSchema,
  EnterprisesRepository,
  FindManyEnterprisesParams,
  FindManyEnterprisesResult,
  UpdateEnterpriseSchema,
} from '../enterprises-repository';

export class PrismaEnterprisesRepository implements EnterprisesRepository {
  async create(data: CreateEnterpriseSchema): Promise<Enterprise> {
    const enterpriseData = await prisma.enterprise.create({
      data: {
        legalName: data.legalName,
        cnpj: data.cnpj,
        taxRegime: data.taxRegime,
        phone: data.phone,
        address: data.address,
        addressNumber: data.addressNumber,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country ?? 'Brasil',
        logoUrl: data.logoUrl,
      },
    });

    const enterprise = Enterprise.create(
      mapEnterprisePrismaToDomain(enterpriseData),
      new UniqueEntityID(enterpriseData.id),
    );
    return enterprise;
  }

  async findById(id: UniqueEntityID): Promise<Enterprise | null> {
    const enterpriseData = await prisma.enterprise.findFirst({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
    });

    if (!enterpriseData) return null;

    const enterprise = Enterprise.create(
      mapEnterprisePrismaToDomain(enterpriseData),
      new UniqueEntityID(enterpriseData.id),
    );
    return enterprise;
  }

  async findByCnpj(
    cnpj: string,
    includeDeleted = false,
  ): Promise<Enterprise | null> {
    const enterpriseData = await prisma.enterprise.findFirst({
      where: {
        cnpj,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });

    if (!enterpriseData) return null;

    const enterprise = Enterprise.create(
      mapEnterprisePrismaToDomain(enterpriseData),
      new UniqueEntityID(enterpriseData.id),
    );
    return enterprise;
  }

  async findMany(
    params: FindManyEnterprisesParams,
  ): Promise<FindManyEnterprisesResult> {
    const { page = 1, perPage = 20, search, includeDeleted = false } = params;

    const where = {
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(search && {
        OR: [
          { legalName: { contains: search, mode: 'insensitive' as const } },
          { cnpj: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [enterprises, total] = await Promise.all([
      prisma.enterprise.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.enterprise.count({ where }),
    ]);

    const enterpriseDomains = enterprises.map(
      (enterpriseData) =>
        new Enterprise(
          mapEnterprisePrismaToDomain(enterpriseData),
          new UniqueEntityID(enterpriseData.id),
        ),
    );

    return { enterprises: enterpriseDomains, total };
  }

  async findManyActive(): Promise<Enterprise[]> {
    const enterprises = await prisma.enterprise.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return enterprises.map(
      (enterpriseData) =>
        new Enterprise(
          mapEnterprisePrismaToDomain(enterpriseData),
          new UniqueEntityID(enterpriseData.id),
        ),
    );
  }

  async findManyInactive(): Promise<Enterprise[]> {
    const enterprises = await prisma.enterprise.findMany({
      where: {
        deletedAt: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });

    return enterprises.map(
      (enterpriseData) =>
        new Enterprise(
          mapEnterprisePrismaToDomain(enterpriseData),
          new UniqueEntityID(enterpriseData.id),
        ),
    );
  }

  async update(data: UpdateEnterpriseSchema): Promise<Enterprise | null> {
    const enterprise = await this.findById(data.id);
    if (!enterprise) {
      return null;
    }

    if (data.legalName !== undefined) {
      enterprise.updateLegalName(data.legalName);
    }

    if (data.taxRegime !== undefined) {
      enterprise.updateTaxRegime(data.taxRegime ?? undefined);
    }

    if (data.phone !== undefined) {
      enterprise.updatePhone(data.phone ?? undefined);
    }

    if (
      data.address !== undefined ||
      data.addressNumber !== undefined ||
      data.complement !== undefined ||
      data.neighborhood !== undefined ||
      data.city !== undefined ||
      data.state !== undefined ||
      data.zipCode !== undefined ||
      data.country !== undefined
    ) {
      enterprise.updateAddress(
        data.address ?? enterprise.address,
        data.addressNumber ?? enterprise.addressNumber,
        data.complement ?? enterprise.complement,
        data.neighborhood ?? enterprise.neighborhood,
        data.city ?? enterprise.city,
        data.state ?? enterprise.state,
        data.zipCode ?? enterprise.zipCode,
        data.country ?? enterprise.country,
      );
    }

    if (data.logoUrl !== undefined) {
      enterprise.updateLogoUrl(data.logoUrl ?? undefined);
    }

    return enterprise;
  }

  async save(enterprise: Enterprise): Promise<void> {
    await prisma.enterprise.update({
      where: {
        id: enterprise.id.toString(),
      },
      data: {
        legalName: enterprise.legalName,
        cnpj: enterprise.cnpj,
        taxRegime: enterprise.taxRegime,
        phone: enterprise.phone,
        address: enterprise.address,
        addressNumber: enterprise.addressNumber,
        complement: enterprise.complement,
        neighborhood: enterprise.neighborhood,
        city: enterprise.city,
        state: enterprise.state,
        zipCode: enterprise.zipCode,
        country: enterprise.country,
        logoUrl: enterprise.logoUrl,
        deletedAt: enterprise.deletedAt,
        updatedAt: enterprise.updatedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const enterprise = await this.findById(id);
    if (enterprise) {
      enterprise.delete();
      await this.save(enterprise);
    }
  }

  async restore(id: UniqueEntityID): Promise<void> {
    const enterprise = await prisma.enterprise.findFirst({
      where: { id: id.toString() },
    });

    if (enterprise && enterprise.deletedAt) {
      await prisma.enterprise.update({
        where: { id: id.toString() },
        data: { deletedAt: null, updatedAt: new Date() },
      });
    }
  }
}
