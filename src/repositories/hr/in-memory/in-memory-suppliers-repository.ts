import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Supplier } from '@/entities/hr/organization/supplier';
import type {
  TaxRegime,
  OrganizationStatus,
} from '@/entities/hr/organization/organization';
import type {
  CreateSupplierSchema,
  SuppliersRepository,
  UpdateSupplierSchema,
} from '../suppliers-repository';
import type {
  FindManyOrganizationsParams,
  FindManyOrganizationsResult,
} from '../base-organization-repository';

export class InMemorySuppliersRepository implements SuppliersRepository {
  public items: Supplier[] = [];
  private sequentialCodeCounter = 0;

  async create(data: CreateSupplierSchema): Promise<Supplier> {
    this.sequentialCodeCounter++;

    const supplier = Supplier.create({
      legalName: data.legalName,
      cnpj: data.cnpj,
      cpf: data.cpf,
      tradeName: data.tradeName,
      stateRegistration: data.stateRegistration,
      municipalRegistration: data.municipalRegistration,
      taxRegime: data.taxRegime as TaxRegime | undefined,
      status: (data.status as OrganizationStatus | undefined) ?? 'ACTIVE',
      email: data.email,
      phoneMain: data.phoneMain,
      website: data.website,
      typeSpecificData: {
        paymentTerms: data.paymentTerms ?? null,
        rating: data.rating ?? null,
        isPreferredSupplier: data.isPreferredSupplier ?? false,
        contractNumber: data.contractNumber ?? null,
        contractStartDate: data.contractStartDate ?? null,
        contractEndDate: data.contractEndDate ?? null,
        leadTime: data.leadTime ?? null,
        minimumOrderValue: data.minimumOrderValue ?? null,
        sequentialCode: this.sequentialCodeCounter,
        externalId: data.externalId ?? null,
        notes: data.notes ?? null,
        ...(data.typeSpecificData ?? {}),
      },
      metadata: data.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.items.push(supplier);
    return supplier;
  }

  async findById(id: UniqueEntityID): Promise<Supplier | null> {
    const supplier = this.items.find(
      (item) => item.id.toString() === id.toString() && !item.isDeleted(),
    );
    return supplier || null;
  }

  async findByCnpj(
    cnpj: string,
    includeDeleted = false,
  ): Promise<Supplier | null> {
    const supplier = this.items.find((item) => {
      const matches = item.cnpj === cnpj;
      return includeDeleted ? matches : matches && !item.isDeleted();
    });
    return supplier || null;
  }

  async findByCpf(
    cpf: string,
    includeDeleted = false,
  ): Promise<Supplier | null> {
    const supplier = this.items.find((item) => {
      const matches = item.cpf === cpf;
      return includeDeleted ? matches : matches && !item.isDeleted();
    });
    return supplier || null;
  }

  async findMany(
    params: FindManyOrganizationsParams,
  ): Promise<FindManyOrganizationsResult<Supplier>> {
    const {
      page = 1,
      perPage = 20,
      search,
      includeDeleted = false,
      status,
    } = params;

    const filtered = this.items.filter((item) => {
      if (!includeDeleted && item.isDeleted()) return false;
      if (status && item.status !== status) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          item.legalName.toLowerCase().includes(searchLower) ||
          item.tradeName?.toLowerCase().includes(searchLower) ||
          item.cnpj?.includes(search) ||
          item.cpf?.includes(search)
        );
      }
      return true;
    });

    const total = filtered.length;
    const organizations = filtered.slice((page - 1) * perPage, page * perPage);

    return { organizations, total };
  }

  async findManyActive(): Promise<Supplier[]> {
    return this.items.filter((item) => item.isActive());
  }

  async findManyInactive(): Promise<Supplier[]> {
    return this.items.filter((item) => item.isDeleted());
  }

  async update(data: UpdateSupplierSchema): Promise<Supplier | null> {
    const supplier = await this.findById(data.id);
    if (!supplier) return null;

    supplier.updateMainData({
      tradeName:
        data.tradeName !== undefined
          ? (data.tradeName ?? undefined)
          : supplier.tradeName,
      stateRegistration:
        data.stateRegistration !== undefined
          ? (data.stateRegistration ?? undefined)
          : supplier.stateRegistration,
      municipalRegistration:
        data.municipalRegistration !== undefined
          ? (data.municipalRegistration ?? undefined)
          : supplier.municipalRegistration,
      taxRegime:
        data.taxRegime !== undefined
          ? ((data.taxRegime as TaxRegime | null) ?? undefined)
          : supplier.taxRegime,
      email:
        data.email !== undefined ? (data.email ?? undefined) : supplier.email,
      phoneMain:
        data.phoneMain !== undefined
          ? (data.phoneMain ?? undefined)
          : supplier.phoneMain,
      website:
        data.website !== undefined
          ? (data.website ?? undefined)
          : supplier.website,
    });

    if (data.legalName !== undefined) {
      supplier.props.legalName = data.legalName;
    }

    if (data.status !== undefined) {
      supplier.changeStatus(data.status as OrganizationStatus);
    }

    const supplierUpdates: Record<string, unknown> = {};
    if (data.paymentTerms !== undefined)
      supplierUpdates.paymentTerms = data.paymentTerms;
    if (data.rating !== undefined) supplierUpdates.rating = data.rating;
    if (data.isPreferredSupplier !== undefined)
      supplierUpdates.isPreferredSupplier = data.isPreferredSupplier;
    if (data.contractNumber !== undefined)
      supplierUpdates.contractNumber = data.contractNumber;
    if (data.contractStartDate !== undefined)
      supplierUpdates.contractStartDate = data.contractStartDate;
    if (data.contractEndDate !== undefined)
      supplierUpdates.contractEndDate = data.contractEndDate;
    if (data.leadTime !== undefined) supplierUpdates.leadTime = data.leadTime;
    if (data.minimumOrderValue !== undefined)
      supplierUpdates.minimumOrderValue = data.minimumOrderValue;
    if (data.externalId !== undefined)
      supplierUpdates.externalId = data.externalId;
    if (data.notes !== undefined) supplierUpdates.notes = data.notes;

    if (Object.keys(supplierUpdates).length > 0) {
      supplier.updateSupplierData(supplierUpdates);
    }

    if (data.metadata !== undefined && data.metadata !== null) {
      supplier.updateMetadata(data.metadata);
    }

    return supplier;
  }

  async save(supplier: Supplier): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === supplier.id.toString(),
    );
    if (index >= 0) {
      this.items[index] = supplier;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const supplier = await this.findById(id);
    if (supplier) {
      supplier.delete();
    }
  }

  async restore(id: UniqueEntityID): Promise<void> {
    const supplier = this.items.find(
      (item) => item.id.toString() === id.toString(),
    );
    if (supplier) {
      supplier.restore();
    }
  }

  async findBySequentialCode(code: number): Promise<Supplier | null> {
    const supplier = this.items.find(
      (item) => item.sequentialCode === code && !item.isDeleted(),
    );
    return supplier || null;
  }

  async findPreferredSuppliers(): Promise<Supplier[]> {
    return this.items.filter(
      (item) => item.isPreferredSupplier && !item.isDeleted(),
    );
  }

  async findByRatingRange(min: number, max: number): Promise<Supplier[]> {
    return this.items.filter((item) => {
      const rating = item.rating;
      return (
        rating !== null &&
        rating !== undefined &&
        rating >= min &&
        rating <= max &&
        !item.isDeleted()
      );
    });
  }
}
