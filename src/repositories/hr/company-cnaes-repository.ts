import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyCnae } from '@/entities/hr/company-cnae';
import { z } from 'zod';

export const CreateCompanyCnaeSchema = z.object({
  companyId: z.instanceof(UniqueEntityID),
  code: z.string(),
  description: z.string().optional(),
  isPrimary: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  pendingIssues: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateCompanyCnaeSchema = z.infer<typeof CreateCompanyCnaeSchema>;

export const UpdateCompanyCnaeSchema = CreateCompanyCnaeSchema.omit({
  companyId: true,
}).partial();

export type UpdateCompanyCnaeSchema = z.infer<typeof UpdateCompanyCnaeSchema>;

export interface FindManyCnaesParams {
  companyId: UniqueEntityID;
  code?: string;
  isPrimary?: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
  includeDeleted?: boolean;
  page?: number;
  perPage?: number;
}

export interface FindManyCnaesResult {
  cnaes: CompanyCnae[];
  total: number;
}

export interface CompanyAeRepository {
  create(data: CreateCompanyCnaeSchema): Promise<CompanyCnae>;
  findById(
    id: UniqueEntityID,
    options?: { companyId?: UniqueEntityID; includeDeleted?: boolean },
  ): Promise<CompanyCnae | null>;
  findByCompanyAndCode(
    companyId: UniqueEntityID,
    code: string,
    options?: { includeDeleted?: boolean },
  ): Promise<CompanyCnae | null>;
  findPrimaryByCompany(companyId: UniqueEntityID): Promise<CompanyCnae | null>;
  findMany(params: FindManyCnaesParams): Promise<FindManyCnaesResult>;
  save(cnae: CompanyCnae): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
  restore(id: UniqueEntityID): Promise<void>;
  unsetPrimaryForCompany(
    companyId: UniqueEntityID,
    exceptId?: UniqueEntityID,
  ): Promise<void>;
}
