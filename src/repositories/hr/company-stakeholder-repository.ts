import { UniqueEntityID } from '../../entities/domain/unique-entity-id';
import { CompanyStakeholder } from '../../entities/hr';

export interface CreateCompanyStakeholderSchema {
  companyId: UniqueEntityID;
  name: string;
  role?: string;
  entryDate?: Date;
  exitDate?: Date;
  personDocumentMasked?: string;
  isLegalRepresentative?: boolean;
  status?: string;
  source?: string;
  rawPayloadRef?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateCompanyStakeholderSchema {
  name?: string;
  role?: string;
  entryDate?: Date | null;
  exitDate?: Date | null;
  personDocumentMasked?: string | null;
  isLegalRepresentative?: boolean;
  status?: string;
  rawPayloadRef?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CompanyStakeholderRepository {
  create(data: CreateCompanyStakeholderSchema): Promise<CompanyStakeholder>;
  findById(id: UniqueEntityID): Promise<CompanyStakeholder | null>;
  findByCompanyId(companyId: UniqueEntityID): Promise<CompanyStakeholder[]>;
  findByCompanyIdAndName(
    companyId: UniqueEntityID,
    name: string,
  ): Promise<CompanyStakeholder | null>;
  findLegalRepresentativeByCompanyId(
    companyId: UniqueEntityID,
  ): Promise<CompanyStakeholder | null>;
  countActiveLegalRepresentatives(companyId: UniqueEntityID): Promise<number>;
  save(stakeholder: CompanyStakeholder): Promise<CompanyStakeholder>;
  delete(id: UniqueEntityID): Promise<void>;
  softDelete(id: UniqueEntityID): Promise<void>;
  anonimize(id: UniqueEntityID): Promise<void>;
}
