import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Form } from '@/entities/sales/form';

export interface CreateFormSchema {
  tenantId: string;
  title: string;
  description?: string;
  createdBy: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface FormsRepository {
  create(data: CreateFormSchema): Promise<Form>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Form | null>;
  findMany(
    page: number,
    perPage: number,
    tenantId: string,
    status?: string,
  ): Promise<Form[]>;
  countByTenant(tenantId: string, status?: string): Promise<number>;
  save(form: Form): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
