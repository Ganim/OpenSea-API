import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
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

  async create(data: CreateManufacturerSchema): Promise<Manufacturer> {
    const manufacturer = Manufacturer.create({
      name: data.name,
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

  async findById(id: UniqueEntityID): Promise<Manufacturer | null> {
    const manufacturer = this.items.find(
      (item) => !item.deletedAt && item.id.equals(id),
    );
    return manufacturer ?? null;
  }

  async findByName(name: string): Promise<Manufacturer | null> {
    const manufacturer = this.items.find(
      (item) => !item.deletedAt && item.name === name,
    );
    return manufacturer ?? null;
  }

  async findMany(): Promise<Manufacturer[]> {
    return this.items.filter((item) => !item.deletedAt);
  }

  async findManyByCountry(country: string): Promise<Manufacturer[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt && item.country.toLowerCase() === country.toLowerCase(),
    );
  }

  async findManyByRating(minRating: number): Promise<Manufacturer[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.rating !== null &&
        item.rating !== undefined &&
        item.rating >= minRating,
    );
  }

  async findManyActive(): Promise<Manufacturer[]> {
    return this.items.filter((item) => !item.deletedAt && item.isActive);
  }

  async update(data: UpdateManufacturerSchema): Promise<Manufacturer | null> {
    const manufacturer = await this.findById(data.id);
    if (!manufacturer) return null;

    if (data.name !== undefined) manufacturer.name = data.name;
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
    const index = this.items.findIndex((i) => i.id.equals(manufacturer.id));
    if (index >= 0) {
      this.items[index] = manufacturer;
    } else {
      this.items.push(manufacturer);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const manufacturer = await this.findById(id);
    if (manufacturer) {
      manufacturer.delete();
    }
  }
}
