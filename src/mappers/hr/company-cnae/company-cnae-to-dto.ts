import type {
  CompanyCnae,
  CompanyCnaeStatus,
} from '@/entities/hr/company-cnae';

export interface CompanyCnaeDTO {
  id: string;
  companyId: string;
  code: string;
  description?: string | null;
  isPrimary: boolean;
  status: CompanyCnaeStatus;
  metadata: Record<string, unknown>;
  pendingIssues: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export function companyCnaeToDTO(cnae: CompanyCnae): CompanyCnaeDTO {
  return {
    id: cnae.id.toString(),
    companyId: cnae.companyId.toString(),
    code: cnae.code,
    description: cnae.description ?? null,
    isPrimary: cnae.isPrimary,
    status: cnae.status,
    metadata: cnae.metadata,
    pendingIssues: cnae.pendingIssues,
    createdAt: cnae.createdAt,
    updatedAt: cnae.updatedAt,
    deletedAt: cnae.deletedAt ?? null,
  };
}
