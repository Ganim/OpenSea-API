import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Enterprise } from '@/entities/hr/enterprise';
import type {
  CreateEnterpriseSchema,
  EnterprisesRepository,
  FindManyEnterprisesParams,
  FindManyEnterprisesResult,
  UpdateEnterpriseSchema,
} from '../enterprises-repository';

export class InMemoryEnterprisesRepository implements EnterprisesRepository {
  private items: Enterprise[] = [];

  async create(data: CreateEnterpriseSchema): Promise<Enterprise> {
    const id = new UniqueEntityID();
    const enterprise = Enterprise.create(
      {
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
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );

    this.items.push(enterprise);
    return enterprise;
  }

  async findById(id: UniqueEntityID): Promise<Enterprise | null> {
    const enterprise = this.items.find(
      (item) => item.id.equals(id) && !item.deletedAt,
    );
    return enterprise || null;
  }

  async findByCnpj(
    cnpj: string,
    includeDeleted = false,
  ): Promise<Enterprise | null> {
    const enterprise = this.items.find((item) => {
      const cnpjMatch = item.cnpj === cnpj;
      if (includeDeleted) {
        return cnpjMatch;
      }
      return cnpjMatch && !item.deletedAt;
    });
    return enterprise || null;
  }

  async findMany(
    params: FindManyEnterprisesParams,
  ): Promise<FindManyEnterprisesResult> {
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
    const enterprises = filteredItems.slice(start, start + perPage);

    return { enterprises, total };
  }

  async findManyActive(): Promise<Enterprise[]> {
    return this.items.filter((item) => !item.deletedAt);
  }

  async findManyInactive(): Promise<Enterprise[]> {
    return this.items.filter((item) => item.deletedAt);
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
    const index = this.items.findIndex((item) => item.id.equals(enterprise.id));

    if (index === -1) {
      this.items.push(enterprise);
    } else {
      this.items[index] = enterprise;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const enterprise = await this.findById(id);
    if (enterprise) {
      enterprise.delete();
      await this.save(enterprise);
    }
  }

  async restore(id: UniqueEntityID): Promise<void> {
    const enterprise = this.items.find((item) => item.id.equals(id));
    if (enterprise && enterprise.isDeleted()) {
      enterprise.restore();
      await this.save(enterprise);
    }
  }
}
