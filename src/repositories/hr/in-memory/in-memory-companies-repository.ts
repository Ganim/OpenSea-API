import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  Company,
  type TaxRegime,
  type CompanyStatus,
} from '@/entities/hr/company';
import type {
  CreateCompanySchema,
  CompaniesRepository,
  FindManyCompaniesParams,
  FindManyCompaniesResult,
  UpdateCompanySchema,
} from '../companies-repository';

export class InMemoryCompaniesRepository implements CompaniesRepository {
  private items: Company[] = [];

  async create(data: CreateCompanySchema): Promise<Company> {
    const id = new UniqueEntityID();
    const company = Company.create(
      {
        legalName: data.legalName,
        cnpj: data.cnpj,
        tradeName: data.tradeName,
        stateRegistration: data.stateRegistration,
        municipalRegistration: data.municipalRegistration,
        legalNature: data.legalNature,
        taxRegime: (data.taxRegime as TaxRegime | undefined) ?? undefined,
        taxRegimeDetail: data.taxRegimeDetail,
        activityStartDate: data.activityStartDate,
        status: (data.status ?? 'ACTIVE') as CompanyStatus,
        email: data.email,
        phoneMain: data.phoneMain,
        phoneAlt: data.phoneAlt,
        logoUrl: data.logoUrl,
        metadata: data.metadata ?? {},
        pendingIssues: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
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

    this.items.push(company);
    return company;
  }

  async findById(id: UniqueEntityID): Promise<Company | null> {
    const company = this.items.find(
      (item) => item.id.equals(id) && !item.deletedAt,
    );
    return company || null;
  }

  async findByCnpj(
    cnpj: string,
    includeDeleted = false,
  ): Promise<Company | null> {
    const company = this.items.find((item) => {
      const cnpjMatch = item.cnpj === cnpj;
      if (includeDeleted) {
        return cnpjMatch;
      }
      return cnpjMatch && !item.deletedAt;
    });
    return company || null;
  }

  async findMany(
    params: FindManyCompaniesParams,
  ): Promise<FindManyCompaniesResult> {
    const { page = 1, perPage = 20, search, includeDeleted = false } = params;

    let filteredItems = this.items.filter((item) =>
      includeDeleted ? true : !item.deletedAt,
    );

    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) =>
          item.legalName.toLowerCase().includes(searchLower) ||
          item.cnpj.includes(search),
      );
    }

    const total = filteredItems.length;
    const start = (page - 1) * perPage;
    const companies = filteredItems.slice(start, start + perPage);

    return { companies, total };
  }

  async findManyActive(): Promise<Company[]> {
    return this.items.filter((item) => !item.deletedAt);
  }

  async findManyInactive(): Promise<Company[]> {
    return this.items.filter((item) => item.deletedAt);
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
    const index = this.items.findIndex((item) => item.id.equals(company.id));

    if (index === -1) {
      this.items.push(company);
    } else {
      this.items[index] = company;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const company = await this.findById(id);
    if (company) {
      company.delete();
      await this.save(company);
    }
  }

  async restore(id: UniqueEntityID): Promise<void> {
    const company = this.items.find((item) => item.id.equals(id));
    if (company && company.isDeleted()) {
      company.restore();
      await this.save(company);
    }
  }
}
