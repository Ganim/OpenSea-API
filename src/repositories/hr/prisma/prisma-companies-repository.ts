import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  Company,
  type TaxRegime,
  type CompanyStatus,
} from '@/entities/hr/company';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { mapCompanyPrismaToDomain } from '@/mappers/hr/company/company-prisma-to-domain';
import type {
  CreateCompanySchema,
  CompaniesRepository,
  FindManyCompaniesParams,
  FindManyCompaniesResult,
  UpdateCompanySchema,
} from '../companies-repository';

export class PrismaCompaniesRepository implements CompaniesRepository {
  async create(data: CreateCompanySchema): Promise<Company> {
    const companyData = await prisma.company.create({
      data: {
        legalName: data.legalName,
        cnpj: data.cnpj,
        tradeName: data.tradeName ?? null,
        stateRegistration: data.stateRegistration ?? null,
        municipalRegistration: data.municipalRegistration ?? null,
        legalNature: data.legalNature ?? null,
        taxRegime: (data.taxRegime as TaxRegime | undefined) ?? null,
        taxRegimeDetail: data.taxRegimeDetail ?? null,
        activityStartDate: data.activityStartDate ?? null,
        status: (data.status ?? 'ACTIVE') as CompanyStatus,
        email: data.email ?? null,
        phoneMain: data.phoneMain ?? null,
        phoneAlt: data.phoneAlt ?? null,
        logoUrl: data.logoUrl ?? null,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
        pendingIssues: [],
      },
    });

    const company = Company.create(
      mapCompanyPrismaToDomain(companyData),
      new UniqueEntityID(companyData.id),
    );

    // Calcular pendências iniciais
    company.updateMainData(
      company.tradeName,
      company.stateRegistration,
      company.municipalRegistration,
      company.legalNature,
      company.taxRegime,
      company.taxRegimeDetail,
      company.activityStartDate,
      company.email,
      company.phoneMain,
      company.phoneAlt,
      company.logoUrl,
    );

    // Salvar com pendências calculadas
    await this.save(company);

    return company;
  }

  async findById(id: UniqueEntityID): Promise<Company | null> {
    const companyData = await prisma.company.findFirst({
      where: {
        id: id.toString(),
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

    if (!companyData) return null;

    const company = Company.create(
      mapCompanyPrismaToDomain(companyData),
      new UniqueEntityID(companyData.id),
    );
    return company;
  }

  async findByCnpj(
    cnpj: string,
    includeDeleted = false,
  ): Promise<Company | null> {
    const companyData = await prisma.company.findFirst({
      where: {
        cnpj,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });

    if (!companyData) return null;

    const company = Company.create(
      mapCompanyPrismaToDomain(companyData),
      new UniqueEntityID(companyData.id),
    );
    return company;
  }

  async findMany(
    params: FindManyCompaniesParams,
  ): Promise<FindManyCompaniesResult> {
    const { page = 1, perPage = 20, search, includeDeleted = false } = params;

    const where: Prisma.CompanyWhereInput = {
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(search && {
        OR: [
          { legalName: { contains: search, mode: 'insensitive' as const } },
          { cnpj: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.company.count({ where }),
    ]);

    const companyDomains = companies.map((companyData) =>
      Company.create(
        mapCompanyPrismaToDomain(companyData),
        new UniqueEntityID(companyData.id),
      ),
    );

    return { companies: companyDomains, total };
  }

  async findManyActive(): Promise<Company[]> {
    const companies = await prisma.company.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return companies.map((companyData) =>
      Company.create(
        mapCompanyPrismaToDomain(companyData),
        new UniqueEntityID(companyData.id),
      ),
    );
  }

  async findManyInactive(): Promise<Company[]> {
    const companies = await prisma.company.findMany({
      where: {
        deletedAt: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });

    return companies.map((companyData) =>
      Company.create(
        mapCompanyPrismaToDomain(companyData),
        new UniqueEntityID(companyData.id),
      ),
    );
  }

  async update(data: UpdateCompanySchema): Promise<Company | null> {
    const company = await this.findById(data.id);
    if (!company) {
      return null;
    }

    // Atualizar campos principais
    if (
      data.legalName !== undefined ||
      data.tradeName !== undefined ||
      data.stateRegistration !== undefined ||
      data.municipalRegistration !== undefined ||
      data.legalNature !== undefined ||
      data.taxRegime !== undefined ||
      data.taxRegimeDetail !== undefined ||
      data.activityStartDate !== undefined ||
      data.email !== undefined ||
      data.phoneMain !== undefined ||
      data.phoneAlt !== undefined ||
      data.logoUrl !== undefined
    ) {
      // Atualizar dados principais (que recalculam pendências)
      company.updateMainData(
        data.tradeName !== undefined
          ? (data.tradeName ?? undefined)
          : company.tradeName,
        data.stateRegistration !== undefined
          ? (data.stateRegistration ?? undefined)
          : company.stateRegistration,
        data.municipalRegistration !== undefined
          ? (data.municipalRegistration ?? undefined)
          : company.municipalRegistration,
        data.legalNature !== undefined
          ? (data.legalNature ?? undefined)
          : company.legalNature,
        data.taxRegime !== undefined
          ? ((data.taxRegime as TaxRegime | null) ?? undefined)
          : company.taxRegime,
        data.taxRegimeDetail !== undefined
          ? (data.taxRegimeDetail ?? undefined)
          : company.taxRegimeDetail,
        data.activityStartDate !== undefined
          ? (data.activityStartDate ?? undefined)
          : company.activityStartDate,
        data.email !== undefined ? (data.email ?? undefined) : company.email,
        data.phoneMain !== undefined
          ? (data.phoneMain ?? undefined)
          : company.phoneMain,
        data.phoneAlt !== undefined
          ? (data.phoneAlt ?? undefined)
          : company.phoneAlt,
        data.logoUrl !== undefined
          ? (data.logoUrl ?? undefined)
          : company.logoUrl,
      );

      if (data.legalName !== undefined) {
        company.props.legalName = data.legalName;
        company.props.updatedAt = new Date();
      }
    }

    // Atualizar status se fornecido
    if (data.status !== undefined) {
      company.changeStatus(data.status as CompanyStatus);
    }

    // Atualizar metadata
    if (data.metadata !== undefined) {
      company.updateMetadata(data.metadata);
    }

    return company;
  }

  async save(company: Company): Promise<void> {
    await prisma.company.update({
      where: {
        id: company.id.toString(),
      },
      data: {
        legalName: company.legalName,
        cnpj: company.cnpj,
        tradeName: company.tradeName ?? null,
        stateRegistration: company.stateRegistration ?? null,
        municipalRegistration: company.municipalRegistration ?? null,
        legalNature: company.legalNature ?? null,
        taxRegime: (company.taxRegime as TaxRegime | null | undefined) ?? null,
        taxRegimeDetail: company.taxRegimeDetail ?? null,
        activityStartDate: company.activityStartDate ?? null,
        status: company.status,
        email: company.email ?? null,
        phoneMain: company.phoneMain ?? null,
        phoneAlt: company.phoneAlt ?? null,
        logoUrl: company.logoUrl ?? null,
        metadata: (company.metadata ?? {}) as Prisma.InputJsonValue,
        pendingIssues: company.pendingIssues ?? [],
        deletedAt: company.deletedAt ?? null,
        updatedAt: company.updatedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const company = await this.findById(id);
    if (company) {
      company.delete();
      await this.save(company);
    }
  }

  async restore(id: UniqueEntityID): Promise<void> {
    const company = await prisma.company.findFirst({
      where: { id: id.toString() },
    });

    if (company && company.deletedAt) {
      await prisma.company.update({
        where: { id: id.toString() },
        data: { deletedAt: null, updatedAt: new Date() },
      });
    }
  }
}
