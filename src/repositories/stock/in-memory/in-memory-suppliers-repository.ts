import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Supplier } from '@/entities/stock/supplier';
import { CNPJ } from '@/entities/stock/value-objects/cnpj';
import type {
  CreateSupplierSchema,
  SuppliersRepository,
  UpdateSupplierSchema,
} from '../suppliers-repository';

export class InMemorySuppliersRepository implements SuppliersRepository {
  public items: Supplier[] = [];

  async create(data: CreateSupplierSchema): Promise<Supplier> {
    const supplier = Supplier.create({
      tenantId: new UniqueEntityID(data.tenantId),
      name: data.name,
      cnpj: data.cnpj,
      taxId: data.taxId,
      contact: data.contact,
      email: data.email,
      phone: data.phone,
      website: data.website,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      country: data.country,
      paymentTerms: data.paymentTerms,
      rating: data.rating,
      isActive: data.isActive ?? true,
      notes: data.notes,
    });

    this.items.push(supplier);
    return supplier;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Supplier | null> {
    const supplier = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return supplier ?? null;
  }

  async findByCNPJ(cnpj: CNPJ, tenantId: string): Promise<Supplier | null> {
    const supplier = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.cnpj?.equals(cnpj) &&
        item.tenantId.toString() === tenantId,
    );
    return supplier ?? null;
  }

  async findByName(name: string, tenantId: string): Promise<Supplier[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.name.toLowerCase().includes(name.toLowerCase()) &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findMany(tenantId: string): Promise<Supplier[]> {
    return this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
    );
  }

  async findManyByRating(
    minRating: number,
    tenantId: string,
  ): Promise<Supplier[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.rating !== null &&
        item.rating !== undefined &&
        item.rating >= minRating &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findManyActive(tenantId: string): Promise<Supplier[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.isActive &&
        item.tenantId.toString() === tenantId,
    );
  }

  async update(data: UpdateSupplierSchema): Promise<Supplier | null> {
    const supplier = this.items.find(
      (item) => !item.deletedAt && item.id.equals(data.id),
    );
    if (!supplier) return null;

    if (data.name !== undefined) supplier.name = data.name;
    if (data.cnpj !== undefined) supplier.cnpj = data.cnpj;
    if (data.taxId !== undefined) supplier.taxId = data.taxId;
    if (data.contact !== undefined) supplier.contact = data.contact;
    if (data.email !== undefined) supplier.email = data.email;
    if (data.phone !== undefined) supplier.phone = data.phone;
    if (data.website !== undefined) supplier.website = data.website;
    if (data.address !== undefined) supplier.address = data.address;
    if (data.city !== undefined) supplier.city = data.city;
    if (data.state !== undefined) supplier.state = data.state;
    if (data.zipCode !== undefined) supplier.zipCode = data.zipCode;
    if (data.country !== undefined) supplier.country = data.country;
    if (data.paymentTerms !== undefined)
      supplier.paymentTerms = data.paymentTerms;
    if (data.rating !== undefined) supplier.rating = data.rating;
    if (data.isActive !== undefined) supplier.isActive = data.isActive;
    if (data.notes !== undefined) supplier.notes = data.notes;

    return supplier;
  }

  async save(supplier: Supplier): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(supplier.id));
    if (index >= 0) {
      this.items[index] = supplier;
    } else {
      this.items.push(supplier);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const supplier = this.items.find(
      (item) => !item.deletedAt && item.id.equals(id),
    );
    if (supplier) {
      supplier.delete();
    }
  }
}
