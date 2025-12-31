import { CompanyStakeholder } from '@/entities/hr';

export interface CompanyStakeholderDTO {
  id: string;
  companyId: string;
  name: string;
  role?:
    | 'SOCIO'
    | 'ADMINISTRADOR'
    | 'PROCURADOR'
    | 'REPRESENTANTE_LEGAL'
    | 'GERENTE'
    | 'DIRETOR'
    | 'OUTRO'
    | null;
  entryDate?: string | null;
  exitDate?: string | null;
  personDocumentMasked?: string | null;
  isLegalRepresentative: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  source: 'CNPJ_API' | 'MANUAL';
  rawPayloadRef?: string | null;
  metadata: Record<string, unknown>;
  pendingIssues: string[];
  createdAt: string;
  updatedAt: string;
}

export function companyStakeholderToDTO(
  stakeholder: CompanyStakeholder,
): CompanyStakeholderDTO {
  return {
    id: stakeholder.id.toString(),
    companyId: stakeholder.companyId.toString(),
    name: stakeholder.name,
    role: stakeholder.role ?? null,
    entryDate: stakeholder.entryDate
      ? stakeholder.entryDate.toISOString()
      : null,
    exitDate: stakeholder.exitDate ? stakeholder.exitDate.toISOString() : null,
    personDocumentMasked: stakeholder.personDocumentMasked ?? null,
    isLegalRepresentative: stakeholder.isLegalRepresentative,
    status: stakeholder.status,
    source: stakeholder.source,
    rawPayloadRef: stakeholder.rawPayloadRef ?? null,
    metadata: stakeholder.metadata,
    pendingIssues: stakeholder.pendingIssues,
    createdAt: stakeholder.createdAt.toISOString(),
    updatedAt: stakeholder.updatedAt.toISOString(),
  };
}

export interface CompanyStakeholderSensitiveDTO {
  id: string;
  companyId: string;
  name: string;
  role?:
    | 'SOCIO'
    | 'ADMINISTRADOR'
    | 'PROCURADOR'
    | 'REPRESENTANTE_LEGAL'
    | 'GERENTE'
    | 'DIRETOR'
    | 'OUTRO'
    | null;
  entryDate?: string | null;
  exitDate?: string | null;
  personDocumentMasked: string;
  isLegalRepresentative: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  source: 'CNPJ_API' | 'MANUAL';
  rawPayloadRef: string;
  metadata: Record<string, unknown>;
  pendingIssues: string[];
  createdAt: string;
  updatedAt: string;
}

export function companyStakeholderToSensitiveDTO(
  stakeholder: CompanyStakeholder,
): CompanyStakeholderSensitiveDTO {
  return {
    id: stakeholder.id.toString(),
    companyId: stakeholder.companyId.toString(),
    name: stakeholder.name,
    role: stakeholder.role ?? null,
    entryDate: stakeholder.entryDate
      ? stakeholder.entryDate.toISOString()
      : null,
    exitDate: stakeholder.exitDate ? stakeholder.exitDate.toISOString() : null,
    personDocumentMasked: '[ENCRYPTED]',
    isLegalRepresentative: stakeholder.isLegalRepresentative,
    status: stakeholder.status,
    source: stakeholder.source,
    rawPayloadRef: '[ENCRYPTED]',
    metadata: stakeholder.metadata,
    pendingIssues: stakeholder.pendingIssues,
    createdAt: stakeholder.createdAt.toISOString(),
    updatedAt: stakeholder.updatedAt.toISOString(),
  };
}
