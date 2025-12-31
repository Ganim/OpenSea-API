import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CompanyCnae } from '@/entities/hr/company-cnae';
import type {
  CompanyAeRepository,
  CreateCompanyCnaeSchema,
  FindManyCnaesParams,
  FindManyCnaesResult,
} from '../company-cnaes-repository';

export class InMemoryCompanyCnaesRepository implements CompanyAeRepository {
  public items: CompanyCnae[] = [];

  async create(data: CreateCompanyCnaeSchema): Promise<CompanyCnae> {
    const cnae = CompanyCnae.create(
      {
        companyId: data.companyId,
        code: data.code,
        description: data.description,
        isPrimary: data.isPrimary ?? false,
        status: data.status ?? 'ACTIVE',
        metadata: data.metadata ?? {},
        pendingIssues: data.pendingIssues ?? [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      new UniqueEntityID(),
    );
    this.items.push(cnae);
    return cnae;
  }

  async findById(
    id: UniqueEntityID,
    options?: { companyId?: UniqueEntityID; includeDeleted?: boolean },
  ): Promise<CompanyCnae | null> {
    const { includeDeleted = false } = options || {};
    const item = this.items.find(
      (cnae) =>
        cnae.id.equals(id) &&
        (includeDeleted
          ? cnae.companyId.equals(options?.companyId || cnae.companyId)
          : cnae.companyId.equals(options?.companyId || cnae.companyId) &&
            !cnae.deletedAt),
    );

    return item ?? null;
  }

  async findByCompanyAndCode(
    companyId: UniqueEntityID,
    code: string,
    options?: { includeDeleted?: boolean },
  ): Promise<CompanyCnae | null> {
    const item = this.items.find(
      (cnae) =>
        cnae.companyId.equals(companyId) &&
        cnae.code === code &&
        (options?.includeDeleted ? true : !cnae.deletedAt),
    );

    return item ?? null;
  }

  async findPrimaryByCompany(
    companyId: UniqueEntityID,
  ): Promise<CompanyCnae | null> {
    const item = this.items.find(
      (cnae) =>
        cnae.companyId.equals(companyId) && cnae.isPrimary && !cnae.deletedAt,
    );

    return item ?? null;
  }

  async findMany(params: FindManyCnaesParams): Promise<FindManyCnaesResult> {
    let filtered = this.items.filter(
      (cnae) =>
        cnae.companyId.equals(params.companyId) &&
        (params.includeDeleted
          ? true
          : cnae.companyId.equals(params.companyId) && !cnae.deletedAt),
    );

    if (params.code) {
      filtered = filtered.filter((cnae) => cnae.code === params.code);
    }

    if (params.isPrimary !== undefined) {
      filtered = filtered.filter((cnae) => cnae.isPrimary === params.isPrimary);
    }

    if (params.status) {
      filtered = filtered.filter((cnae) => cnae.status === params.status);
    }

    const page = params.page ?? 1;
    const perPage = params.perPage ?? 20;
    const start = (page - 1) * perPage;
    const end = start + perPage;

    return {
      cnaes: filtered.slice(start, end),
      total: filtered.length,
    };
  }

  async save(cnae: CompanyCnae): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(cnae.id));
    if (index !== -1) {
      this.items[index] = cnae;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const item = this.items.find((cnae) => cnae.id.equals(id));
    if (item) {
      item.markAsDeleted();
    }
  }

  async restore(id: UniqueEntityID): Promise<void> {
    const item = this.items.find((cnae) => cnae.id.equals(id));
    if (item) {
      item.restore();
    }
  }

  async unsetPrimaryForCompany(
    companyId: UniqueEntityID,
    exceptId?: UniqueEntityID,
  ): Promise<void> {
    this.items.forEach((cnae) => {
      if (
        cnae.companyId.equals(companyId) &&
        (!exceptId || !cnae.id.equals(exceptId)) &&
        !cnae.deletedAt
      ) {
        cnae.update({ isPrimary: false });
      }
    });
  }
}
