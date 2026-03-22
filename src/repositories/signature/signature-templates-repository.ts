import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureTemplate } from '@/entities/signature/signature-template';

export interface CreateSignatureTemplateSchema {
  tenantId: string;
  name: string;
  description?: string | null;
  signatureLevel: string;
  routingType: string;
  signerSlots: unknown;
  expirationDays?: number | null;
  reminderDays?: number;
  isActive?: boolean;
}

export interface UpdateSignatureTemplateSchema {
  id: string;
  name?: string;
  description?: string | null;
  signatureLevel?: string;
  routingType?: string;
  signerSlots?: unknown;
  expirationDays?: number | null;
  reminderDays?: number;
  isActive?: boolean;
}

export interface ListSignatureTemplatesParams {
  tenantId: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FindManyTemplatesResult {
  templates: SignatureTemplate[];
  total: number;
}

export interface SignatureTemplatesRepository {
  create(data: CreateSignatureTemplateSchema): Promise<SignatureTemplate>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<SignatureTemplate | null>;
  findMany(
    params: ListSignatureTemplatesParams,
  ): Promise<FindManyTemplatesResult>;
  update(
    data: UpdateSignatureTemplateSchema,
  ): Promise<SignatureTemplate | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
