import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Customer } from '@/entities/sales/customer';
import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import { Document } from '@/entities/sales/value-objects/document';
import type {
  CreateCustomerSchema,
  CustomersRepository,
  UpdateCustomerSchema,
} from '../customers-repository';

export class InMemoryCustomersRepository implements CustomersRepository {
  public items: Customer[] = [];

  async create(data: CreateCustomerSchema): Promise<Customer> {
    const customer = Customer.create({
      tenantId: new UniqueEntityID(data.tenantId),
      name: data.name,
      type: data.type,
      document: data.document,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      country: data.country,
      notes: data.notes,
      isActive: data.isActive ?? true,
    });

    this.items.push(customer);
    return customer;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Customer | null> {
    const customer = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return customer ?? null;
  }

  async findByDocument(
    document: Document,
    tenantId: string,
  ): Promise<Customer | null> {
    const customer = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.document?.value === document.value &&
        item.tenantId.toString() === tenantId,
    );
    return customer ?? null;
  }

  async findByEmail(email: string, tenantId: string): Promise<Customer | null> {
    const customer = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.email === email &&
        item.tenantId.toString() === tenantId,
    );
    return customer ?? null;
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<Customer[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter(
        (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
      )
      .slice(start, start + perPage);
  }

  async findManyActive(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<Customer[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter(
        (item) =>
          !item.deletedAt &&
          item.isActive &&
          item.tenantId.toString() === tenantId,
      )
      .slice(start, start + perPage);
  }

  async findManyByType(
    type: CustomerType,
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<Customer[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter(
        (item) =>
          !item.deletedAt &&
          item.type.value === type.value &&
          item.tenantId.toString() === tenantId,
      )
      .slice(start, start + perPage);
  }

  async update(data: UpdateCustomerSchema): Promise<Customer | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));

    if (index === -1) {
      return null;
    }

    const customer = this.items[index];

    if (data.name !== undefined) customer.name = data.name;
    if (data.type !== undefined) customer.type = data.type;
    if (data.document !== undefined) customer.document = data.document;
    if (data.email !== undefined) customer.email = data.email;
    if (data.phone !== undefined) customer.phone = data.phone;
    if (data.address !== undefined) customer.address = data.address;
    if (data.city !== undefined) customer.city = data.city;
    if (data.state !== undefined) customer.state = data.state;
    if (data.zipCode !== undefined) customer.zipCode = data.zipCode;
    if (data.country !== undefined) customer.country = data.country;
    if (data.notes !== undefined) customer.notes = data.notes;
    if (data.isActive !== undefined) customer.isActive = data.isActive;

    return customer;
  }

  async save(customer: Customer): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(customer.id));

    if (index >= 0) {
      this.items[index] = customer;
    } else {
      this.items.push(customer);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const customer = this.items.find(
      (item) => !item.deletedAt && item.id.equals(id),
    );

    if (customer) {
      customer.delete();
    }
  }
}
