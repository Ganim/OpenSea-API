import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Manufacturer } from '@/entities/stock/manufacturer';
import type {
  CreateManufacturerSchema,
  ManufacturersRepository,
  UpdateManufacturerSchema,
} from '../manufacturers-repository';

export class InMemoryManufacturersRepository
  implements ManufacturersRepository
{
  public items: Manufacturer[] = [];
  private sequentialCounter = 0;

  async create(data: CreateManufacturerSchema): Promise<Manufacturer> {
    const manufacturer = Manufacturer.create({
      tenantId: new UniqueEntityID(data.tenantId),
      code: data.code,
      sequentialCode: this.sequentialCounter,
      name: data.name,
      legalName: data.legalName ?? null,
      cnpj: data.cnpj ?? null,
      country: data.country,
      email: data.email ?? null,
      phone: data.phone ?? null,
      website: data.website ?? null,
      addressLine1: data.addressLine1 ?? null,
      addressLine2: data.addressLine2 ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      postalCode: data.postalCode ?? null,
      isActive: data.isActive ?? true,
      rating: data.rating ?? null,
      notes: data.notes ?? null,
    });

    this.items.push(manufacturer);
    return manufacturer;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Manufacturer | null> {
    const manufacturer = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.manufacturerId.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return manufacturer ?? null;
  }

  async findByName(
    name: string,
    tenantId: string,
  ): Promise<Manufacturer | null> {
    const manufacturer = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.name === name &&
        item.tenantId.toString() === tenantId,
    );
    return manufacturer ?? null;
  }

  async findMany(tenantId: string): Promise<Manufacturer[]> {
    return this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
    );
  }

  async findManyByCountry(
    country: string,
    tenantId: string,
  ): Promise<Manufacturer[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.country.toLowerCase() === country.toLowerCase() &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findManyByRating(
    minRating: number,
    tenantId: string,
  ): Promise<Manufacturer[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.rating !== null &&
        item.rating !== undefined &&
        item.rating >= minRating &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findManyActive(tenantId: string): Promise<Manufacturer[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.isActive &&
        item.tenantId.toString() === tenantId,
    );
  }

  async update(data: UpdateManufacturerSchema): Promise<Manufacturer | null> {
    const manufacturer = this.items.find(
      (item) => !item.deletedAt && item.manufacturerId.equals(data.id),
    );
    if (!manufacturer) return null;

    if (data.name !== undefined) manufacturer.name = data.name;
    if (data.legalName !== undefined) manufacturer.legalName = data.legalName;
    if (data.cnpj !== undefined) manufacturer.cnpj = data.cnpj;
    if (data.country !== undefined) manufacturer.country = data.country;
    if (data.email !== undefined) manufacturer.email = data.email;
    if (data.phone !== undefined) manufacturer.phone = data.phone;
    if (data.website !== undefined) manufacturer.website = data.website;
    if (data.addressLine1 !== undefined)
      manufacturer.addressLine1 = data.addressLine1;
    if (data.addressLine2 !== undefined)
      manufacturer.addressLine2 = data.addressLine2;
    if (data.city !== undefined) manufacturer.city = data.city;
    if (data.state !== undefined) manufacturer.state = data.state;
    if (data.postalCode !== undefined)
      manufacturer.postalCode = data.postalCode;
    if (data.isActive !== undefined) manufacturer.isActive = data.isActive;
    if (data.rating !== undefined) manufacturer.rating = data.rating;
    if (data.notes !== undefined) manufacturer.notes = data.notes;

    return manufacturer;
  }

  async save(manufacturer: Manufacturer): Promise<void> {
    const index = this.items.findIndex((i) =>
      i.manufacturerId.equals(manufacturer.manufacturerId),
    );
    if (index >= 0) {
      this.items[index] = manufacturer;
    } else {
      this.items.push(manufacturer);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const manufacturer = this.items.find(
      (item) => !item.deletedAt && item.manufacturerId.equals(id),
    );
    if (manufacturer) {
      manufacturer.delete();
    }
  }

  async getNextSequentialCode(_tenantId: string): Promise<number> {
    this.sequentialCounter += 1;
    return this.sequentialCounter;
  }
}
