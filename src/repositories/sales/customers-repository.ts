import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Customer } from '@/entities/sales/customer';
import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import { Document } from '@/entities/sales/value-objects/document';

export interface CreateCustomerSchema {
  tenantId: string;
  name: string;
  type: CustomerType;
  document?: Document;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateCustomerSchema {
  id: UniqueEntityID;
  name?: string;
  type?: CustomerType;
  document?: Document;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
  isActive?: boolean;
}

export interface CustomersRepository {
  // CREATE
  create(data: CreateCustomerSchema): Promise<Customer>;

  // READ
  findById(id: UniqueEntityID, tenantId: string): Promise<Customer | null>;
  findByDocument(
    document: Document,
    tenantId: string,
  ): Promise<Customer | null>;
  findByEmail(email: string, tenantId: string): Promise<Customer | null>;
  findMany(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<Customer[]>;
  findManyActive(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<Customer[]>;
  findManyByType(
    type: CustomerType,
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<Customer[]>;

  // UPDATE
  update(data: UpdateCustomerSchema): Promise<Customer | null>;
  save(customer: Customer): Promise<void>;

  // DELETE
  delete(id: UniqueEntityID): Promise<void>;
}
