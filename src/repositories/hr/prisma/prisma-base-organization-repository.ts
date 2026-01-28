import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  Organization,
  OrganizationType,
  TaxRegime,
  OrganizationStatus,
} from '@/entities/hr/organization';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/generated/client.js';
import type {
  BaseOrganizationRepository,
  CreateOrganizationSchema,
  FindManyOrganizationsParams,
  FindManyOrganizationsResult,
  UpdateOrganizationSchema,
} from '../base-organization-repository';

export abstract class PrismaBaseOrganizationRepository<T extends Organization>
  implements BaseOrganizationRepository<T>
{
  protected abstract readonly organizationType: OrganizationType;
  protected abstract toDomain(data: Record<string, unknown>): T;
  protected abstract fromDomain(
    organization: T,
  ): Prisma.OrganizationUpdateInput;

  async create(data: CreateOrganizationSchema): Promise<T> {
    const organizationData = await prisma.organization.create({
      data: {
        type: this.organizationType,
        legalName: data.legalName,
        cnpj: data.cnpj ?? null,
        cpf: data.cpf ?? null,
        tradeName: data.tradeName ?? null,
        stateRegistration: data.stateRegistration ?? null,
        municipalRegistration: data.municipalRegistration ?? null,
        taxRegime: (data.taxRegime as TaxRegime | undefined) ?? null,
        status: (data.status ?? 'ACTIVE') as OrganizationStatus,
        email: data.email ?? null,
        phoneMain: data.phoneMain ?? null,
        website: data.website ?? null,
        typeSpecificData: (data.typeSpecificData ??
          {}) as Prisma.InputJsonValue,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    return this.toDomain(organizationData);
  }

  async findById(id: UniqueEntityID): Promise<T | null> {
    const organizationData = await prisma.organization.findFirst({
      where: {
        id: id.toString(),
        type: this.organizationType,
        deletedAt: null,
      },
      include: {
        addresses: {
          where: { deletedAt: null },
          orderBy: { isPrimary: 'desc' },
        },
        cnaes: {
          where: { deletedAt: null },
          orderBy: { isPrimary: 'desc' },
        },
        fiscalSettings: {
          where: { deletedAt: null },
        },
        stakeholders: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!organizationData) return null;

    return this.toDomain(organizationData);
  }

  async findByCnpj(cnpj: string, includeDeleted = false): Promise<T | null> {
    const organizationData = await prisma.organization.findFirst({
      where: {
        cnpj,
        type: this.organizationType,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });

    if (!organizationData) return null;

    return this.toDomain(organizationData);
  }

  async findByCpf(cpf: string, includeDeleted = false): Promise<T | null> {
    const organizationData = await prisma.organization.findFirst({
      where: {
        cpf,
        type: this.organizationType,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });

    if (!organizationData) return null;

    return this.toDomain(organizationData);
  }

  async findMany(
    params: FindManyOrganizationsParams,
  ): Promise<FindManyOrganizationsResult<T>> {
    const {
      page = 1,
      perPage = 20,
      search,
      includeDeleted = false,
      status,
    } = params;

    const where: Prisma.OrganizationWhereInput = {
      type: this.organizationType,
    };

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (status) {
      where.status = status as Prisma.EnumOrganizationStatusEnumFilter;
    }

    if (search) {
      where.OR = [
        { legalName: { contains: search, mode: 'insensitive' } },
        { tradeName: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.organization.count({ where }),
    ]);

    const organizationDomains = organizations.map((data) =>
      this.toDomain(data),
    );

    return { organizations: organizationDomains, total };
  }

  async findManyActive(): Promise<T[]> {
    const organizations = await prisma.organization.findMany({
      where: {
        type: this.organizationType,
        status: 'ACTIVE',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return organizations.map((data) => this.toDomain(data));
  }

  async findManyInactive(): Promise<T[]> {
    const organizations = await prisma.organization.findMany({
      where: {
        type: this.organizationType,
        deletedAt: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });

    return organizations.map((data) => this.toDomain(data));
  }

  async update(data: UpdateOrganizationSchema): Promise<T | null> {
    const organization = await this.findById(data.id);
    if (!organization) {
      return null;
    }

    // Atualizar campos principais
    organization.updateMainData({
      tradeName:
        data.tradeName !== undefined
          ? (data.tradeName ?? undefined)
          : organization.tradeName,
      stateRegistration:
        data.stateRegistration !== undefined
          ? (data.stateRegistration ?? undefined)
          : organization.stateRegistration,
      municipalRegistration:
        data.municipalRegistration !== undefined
          ? (data.municipalRegistration ?? undefined)
          : organization.municipalRegistration,
      taxRegime:
        data.taxRegime !== undefined
          ? ((data.taxRegime as TaxRegime | null) ?? undefined)
          : organization.taxRegime,
      email:
        data.email !== undefined
          ? (data.email ?? undefined)
          : organization.email,
      phoneMain:
        data.phoneMain !== undefined
          ? (data.phoneMain ?? undefined)
          : organization.phoneMain,
      website:
        data.website !== undefined
          ? (data.website ?? undefined)
          : organization.website,
    });

    if (data.legalName !== undefined) {
      organization.props.legalName = data.legalName;
      organization.props.updatedAt = new Date();
    }

    // Atualizar status se fornecido
    if (data.status !== undefined) {
      organization.changeStatus(data.status as OrganizationStatus);
    }

    // Atualizar typeSpecificData
    if (data.typeSpecificData !== undefined) {
      organization.updateTypeSpecificData(
        data.typeSpecificData as Record<string, unknown>,
      );
    }

    // Atualizar metadata
    if (data.metadata !== undefined) {
      organization.updateMetadata(data.metadata as Record<string, unknown>);
    }

    await this.save(organization);

    return organization;
  }

  async save(organization: T): Promise<void> {
    const data = this.fromDomain(organization);

    await prisma.organization.update({
      where: {
        id: organization.id.toString(),
      },
      data: {
        ...data,
        updatedAt: organization.updatedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const organization = await this.findById(id);
    if (organization) {
      organization.delete();
      await this.save(organization);
    }
  }

  async restore(id: UniqueEntityID): Promise<void> {
    const organization = await prisma.organization.findFirst({
      where: { id: id.toString(), type: this.organizationType },
    });

    if (organization && organization.deletedAt) {
      await prisma.organization.update({
        where: { id: id.toString() },
        data: { deletedAt: null, updatedAt: new Date() },
      });
    }
  }
}
