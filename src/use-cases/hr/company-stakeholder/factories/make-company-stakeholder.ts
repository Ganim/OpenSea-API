import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  CompanyStakeholder,
  type CompanyStakeholderRole,
  type CompanyStakeholderSource,
  type CompanyStakeholderStatus,
} from '@/entities/hr';
import { randomUUID } from 'crypto';

interface MakeCompanyStakeholderParams {
  id?: string;
  companyId?: string;
  name?: string;
  role?: string;
  entryDate?: Date;
  exitDate?: Date;
  personDocumentMasked?: string;
  isLegalRepresentative?: boolean;
  status?: string;
  source?: string;
  rawPayloadRef?: string;
}

export function makeCompanyStakeholder(
  params: MakeCompanyStakeholderParams = {},
): CompanyStakeholder {
  return CompanyStakeholder.create(
    {
      companyId: new UniqueEntityID(params.companyId ?? 'company-1'),
      name: params.name ?? 'João da Silva',
      role: params.role as CompanyStakeholderRole,
      entryDate: params.entryDate,
      exitDate: params.exitDate,
      personDocumentMasked: params.personDocumentMasked ?? '***456789**',
      isLegalRepresentative: params.isLegalRepresentative ?? false,
      status: (params.status ?? 'ACTIVE') as CompanyStakeholderStatus,
      source: (params.source ?? 'MANUAL') as CompanyStakeholderSource,
      rawPayloadRef: params.rawPayloadRef,
      metadata: {},
      pendingIssues: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    params.id
      ? new UniqueEntityID(params.id)
      : new UniqueEntityID(randomUUID()),
  );
}
