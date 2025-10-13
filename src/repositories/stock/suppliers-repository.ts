import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Supplier } from '@/entities/stock/supplier';
import { CNPJ } from '@/entities/stock/value-objects/cnpj';

export interface CreateSupplierSchema {
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
  findById(id: UniqueEntityID): Promise<Supplier | null>;
  findByCNPJ(cnpj: CNPJ): Promise<Supplier | null>;
  findByName(name: string): Promise<Supplier[]>;
  findMany(): Promise<Supplier[]>;
  findManyActive(): Promise<Supplier[]>;
  findManyByRating(minRating: number): Promise<Supplier[]>;
  update(data: UpdateSupplierSchema): Promise<Supplier | null>;
  save(supplier: Supplier): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
