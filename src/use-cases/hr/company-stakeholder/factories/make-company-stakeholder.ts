import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CompanyStakeholder } from '@/entities/hr';
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
      role: params.role as any,
      entryDate: params.entryDate,
      exitDate: params.exitDate,
      personDocumentMasked: params.personDocumentMasked ?? '***456789**',
      isLegalRepresentative: params.isLegalRepresentative ?? false,
      status: (params.status ?? 'ACTIVE') as any,
      source: (params.source ?? 'MANUAL') as any,
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
