import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Manufacturer } from '@/entities/hr/organization/manufacturer';
import type {
  TaxRegime,
  OrganizationStatus,
} from '@/entities/hr/organization/organization';
import type {
  CreateManufacturerSchema,
  ManufacturersRepository,
  UpdateManufacturerSchema,
} from '../manufacturers-repository';
import type {
  FindManyOrganizationsParams,
  FindManyOrganizationsResult,
} from '../base-organization-repository';

export class InMemoryManufacturersRepository
  implements ManufacturersRepository
{
  public items: Manufacturer[] = [];
  private sequentialCodeCounter = 0;

  async create(data: CreateManufacturerSchema): Promise<Manufacturer> {
    this.sequentialCodeCounter++;

    const manufacturer = Manufacturer.create({
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
        productionCapacity: data.productionCapacity ?? null,
        leadTime: data.leadTime ?? null,
        certifications: data.certifications ?? [],
        qualityRating: data.qualityRating ?? null,
        defectRate: data.defectRate ?? null,
        minimumOrderQuantity: data.minimumOrderQuantity ?? null,
        paymentTerms: data.paymentTerms ?? null,
        countryOfOrigin: data.countryOfOrigin ?? null,
        factoryLocation: data.factoryLocation ?? null,
        sequentialCode: this.sequentialCodeCounter,
        externalId: data.externalId ?? null,
        notes: data.notes ?? null,
        ...(data.typeSpecificData ?? {}),
      },
      metadata: data.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.items.push(manufacturer);
    return manufacturer;
  }

  async findById(id: UniqueEntityID): Promise<Manufacturer | null> {
    const manufacturer = this.items.find(
      (item) => item.id.toString() === id.toString() && !item.isDeleted(),
    );
    return manufacturer || null;
  }

  async findByCnpj(
    cnpj: string,
    includeDeleted = false,
  ): Promise<Manufacturer | null> {
    const manufacturer = this.items.find((item) => {
      const matches = item.cnpj === cnpj;
      return includeDeleted ? matches : matches && !item.isDeleted();
    });
    return manufacturer || null;
  }

  async findByCpf(
    cpf: string,
    includeDeleted = false,
  ): Promise<Manufacturer | null> {
    const manufacturer = this.items.find((item) => {
      const matches = item.cpf === cpf;
      return includeDeleted ? matches : matches && !item.isDeleted();
    });
    return manufacturer || null;
  }

  async findMany(
    params: FindManyOrganizationsParams,
  ): Promise<FindManyOrganizationsResult<Manufacturer>> {
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

  async findManyActive(): Promise<Manufacturer[]> {
    return this.items.filter((item) => item.isActive());
  }

  async findManyInactive(): Promise<Manufacturer[]> {
    return this.items.filter((item) => item.isDeleted());
  }

  async update(data: UpdateManufacturerSchema): Promise<Manufacturer | null> {
    const manufacturer = await this.findById(data.id);
    if (!manufacturer) return null;

    manufacturer.updateMainData({
      tradeName:
        data.tradeName !== undefined
          ? (data.tradeName ?? undefined)
          : manufacturer.tradeName,
      stateRegistration:
        data.stateRegistration !== undefined
          ? (data.stateRegistration ?? undefined)
          : manufacturer.stateRegistration,
      municipalRegistration:
        data.municipalRegistration !== undefined
          ? (data.municipalRegistration ?? undefined)
          : manufacturer.municipalRegistration,
      taxRegime:
        data.taxRegime !== undefined
          ? ((data.taxRegime as TaxRegime | null) ?? undefined)
          : manufacturer.taxRegime,
      email:
        data.email !== undefined
          ? (data.email ?? undefined)
          : manufacturer.email,
      phoneMain:
        data.phoneMain !== undefined
          ? (data.phoneMain ?? undefined)
          : manufacturer.phoneMain,
      website:
        data.website !== undefined
          ? (data.website ?? undefined)
          : manufacturer.website,
    });

    if (data.legalName !== undefined) {
      manufacturer.props.legalName = data.legalName;
    }

    if (data.status !== undefined) {
      manufacturer.changeStatus(data.status as OrganizationStatus);
    }

    const manufacturerUpdates: Record<string, unknown> = {};
    if (data.productionCapacity !== undefined)
      manufacturerUpdates.productionCapacity = data.productionCapacity;
    if (data.leadTime !== undefined)
      manufacturerUpdates.leadTime = data.leadTime;
    if (data.certifications !== undefined)
      manufacturerUpdates.certifications = data.certifications;
    if (data.qualityRating !== undefined)
      manufacturerUpdates.qualityRating = data.qualityRating;
    if (data.defectRate !== undefined)
      manufacturerUpdates.defectRate = data.defectRate;
    if (data.minimumOrderQuantity !== undefined)
      manufacturerUpdates.minimumOrderQuantity = data.minimumOrderQuantity;
    if (data.paymentTerms !== undefined)
      manufacturerUpdates.paymentTerms = data.paymentTerms;
    if (data.countryOfOrigin !== undefined)
      manufacturerUpdates.countryOfOrigin = data.countryOfOrigin;
    if (data.factoryLocation !== undefined)
      manufacturerUpdates.factoryLocation = data.factoryLocation;
    if (data.externalId !== undefined)
      manufacturerUpdates.externalId = data.externalId;
    if (data.notes !== undefined) manufacturerUpdates.notes = data.notes;

    if (Object.keys(manufacturerUpdates).length > 0) {
      manufacturer.updateManufacturerData(manufacturerUpdates);
    }

    if (data.metadata !== undefined) {
      manufacturer.updateMetadata(data.metadata ?? {});
    }

    return manufacturer;
  }

  async save(manufacturer: Manufacturer): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === manufacturer.id.toString(),
    );
    if (index >= 0) {
      this.items[index] = manufacturer;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const manufacturer = await this.findById(id);
    if (manufacturer) {
      manufacturer.delete();
    }
  }

  async restore(id: UniqueEntityID): Promise<void> {
    const manufacturer = this.items.find(
      (item) => item.id.toString() === id.toString(),
    );
    if (manufacturer) {
      manufacturer.restore();
    }
  }

  async findBySequentialCode(code: number): Promise<Manufacturer | null> {
    const manufacturer = this.items.find(
      (item) => item.sequentialCode === code && !item.isDeleted(),
    );
    return manufacturer || null;
  }

  async findByCountry(country: string): Promise<Manufacturer[]> {
    return this.items.filter(
      (item) => item.countryOfOrigin === country && !item.isDeleted(),
    );
  }

  async findByCertification(certification: string): Promise<Manufacturer[]> {
    return this.items.filter(
      (item) => item.hasCertification(certification) && !item.isDeleted(),
    );
  }

  async findByQualityRatingRange(
    min: number,
    max: number,
  ): Promise<Manufacturer[]> {
    return this.items.filter((item) => {
      const rating = item.qualityRating;
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
