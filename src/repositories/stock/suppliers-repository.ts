import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Supplier } from '@/entities/stock/supplier';
import { CNPJ } from '@/entities/stock/value-objects/cnpj';

export interface CreateSupplierSchema {
  tenantId: string;
  name: string;
  cnpj?: CNPJ;
  taxId?: string;
  contact?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  paymentTerms?: string;
  rating?: number;
  isActive?: boolean;
  notes?: string;
}

export interface UpdateSupplierSchema {
  id: UniqueEntityID;
  name?: string;
  cnpj?: CNPJ;
  taxId?: string;
  contact?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  paymentTerms?: string;
  rating?: number;
  isActive?: boolean;
  notes?: string;
}

export interface SuppliersRepository {
  create(data: CreateSupplierSchema): Promise<Supplier>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Supplier | null>;
  findByCNPJ(cnpj: CNPJ, tenantId: string): Promise<Supplier | null>;
  findByName(name: string, tenantId: string): Promise<Supplier[]>;
  findMany(tenantId: string): Promise<Supplier[]>;
  findManyActive(tenantId: string): Promise<Supplier[]>;
  findManyByRating(minRating: number, tenantId: string): Promise<Supplier[]>;
  update(data: UpdateSupplierSchema): Promise<Supplier | null>;
  save(supplier: Supplier): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
