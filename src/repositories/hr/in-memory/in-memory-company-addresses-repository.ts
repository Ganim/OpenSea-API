import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  CompanyAddress,
  type CompanyAddressType,
} from '@/entities/hr/company-address';
import type {
  CompanyAddressesRepository,
  CreateCompanyAddressSchema,
  FindManyCompanyAddressesParams,
  FindManyCompanyAddressesResult,
} from '../company-addresses-repository';

export class InMemoryCompanyAddressesRepository
  implements CompanyAddressesRepository
{
  public items: CompanyAddress[] = [];

  async create(data: CreateCompanyAddressSchema): Promise<CompanyAddress> {
    const address = CompanyAddress.create(
      {
        companyId: data.companyId,
        type: data.type ?? 'OTHER',
        street: data.street,
        number: data.number,
        complement: data.complement,
        district: data.district,
        city: data.city,
        state: data.state,
        zip: data.zip,
        ibgeCityCode: data.ibgeCityCode,
        countryCode: data.countryCode ?? 'BR',
        isPrimary: data.isPrimary ?? false,
        metadata: data.metadata ?? {},
        pendingIssues: data.pendingIssues ?? [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      new UniqueEntityID(),
    );

    this.items.push(address);
    return address;
  }

  async findById(
    id: UniqueEntityID,
    options?: { companyId?: UniqueEntityID; includeDeleted?: boolean },
  ): Promise<CompanyAddress | null> {
    const address = this.items.find((item) => {
      const idMatch = item.id.equals(id);
      const companyMatch = options?.companyId
        ? item.companyId.equals(options.companyId)
        : true;
      const deletedMatch = options?.includeDeleted ? true : !item.deletedAt;
      return idMatch && companyMatch && deletedMatch;
    });
    return address ?? null;
  }

  async findByCompanyAndType(
    companyId: UniqueEntityID,
    type: CompanyAddressType,
    options?: { includeDeleted?: boolean },
  ): Promise<CompanyAddress | null> {
    const address = this.items.find((item) => {
      const companyMatch = item.companyId.equals(companyId);
      const typeMatch = item.type === type;
      const deletedMatch = options?.includeDeleted ? true : !item.deletedAt;
      return companyMatch && typeMatch && deletedMatch;
    });
    return address ?? null;
  }

  async findPrimaryByType(
    companyId: UniqueEntityID,
    type: CompanyAddressType,
  ): Promise<CompanyAddress | null> {
    const address = this.items.find(
      (item) =>
        item.companyId.equals(companyId) &&
        item.type === type &&
        item.isPrimary &&
        !item.deletedAt,
    );
    return address ?? null;
  }

  async findMany(
    params: FindManyCompanyAddressesParams,
  ): Promise<FindManyCompanyAddressesResult> {
    const {
      companyId,
      type,
      isPrimary,
      includeDeleted = false,
      page = 1,
      perPage = 20,
    } = params;

    let filtered = this.items.filter((item) =>
      includeDeleted
        ? item.companyId.equals(companyId)
        : item.companyId.equals(companyId) && !item.deletedAt,
    );

    if (type) filtered = filtered.filter((item) => item.type === type);
    if (isPrimary !== undefined)
      filtered = filtered.filter((item) => item.isPrimary === isPrimary);

    const total = filtered.length;
    const start = (page - 1) * perPage;
    const addresses = filtered.slice(start, start + perPage);

    return { addresses, total };
  }

  async save(address: CompanyAddress): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(address.id));
    if (index >= 0) {
      this.items[index] = address;
    } else {
      this.items.push(address);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const address = await this.findById(id, { includeDeleted: true });
    if (address) {
      address.delete();
      await this.save(address);
    }
  }

  async unsetPrimaryForType(
    companyId: UniqueEntityID,
    type: CompanyAddressType,
    exceptId?: UniqueEntityID,
  ): Promise<void> {
    this.items = this.items.map((item) => {
      if (
        item.companyId.equals(companyId) &&
        item.type === type &&
        (!exceptId || !item.id.equals(exceptId)) &&
        !item.deletedAt
      ) {
        item.markAsSecondary();
      }
      return item;
    });
  }
}
