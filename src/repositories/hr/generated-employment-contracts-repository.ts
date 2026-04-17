import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { GeneratedEmploymentContract } from '@/entities/hr/generated-employment-contract';

export interface CreateGeneratedEmploymentContractSchema {
  tenantId: string;
  templateId: UniqueEntityID;
  employeeId: UniqueEntityID;
  generatedBy: UniqueEntityID;
  variables: Record<string, unknown>;
  pdfUrl?: string;
  pdfKey?: string;
  storageFileId?: UniqueEntityID;
}

export interface FindManyGeneratedContractsParams {
  tenantId: string;
  employeeId?: UniqueEntityID;
  templateId?: UniqueEntityID;
  page?: number;
  perPage?: number;
}

export interface FindManyGeneratedContractsResult {
  contracts: GeneratedEmploymentContract[];
  total: number;
}

export interface GeneratedEmploymentContractsRepository {
  create(
    data: CreateGeneratedEmploymentContractSchema,
  ): Promise<GeneratedEmploymentContract>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<GeneratedEmploymentContract | null>;
  findBySignatureEnvelopeId(
    envelopeId: string,
    tenantId: string,
  ): Promise<GeneratedEmploymentContract | null>;
  findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<GeneratedEmploymentContract[]>;
  findMany(
    params: FindManyGeneratedContractsParams,
  ): Promise<FindManyGeneratedContractsResult>;
  save(contract: GeneratedEmploymentContract): Promise<void>;
  updateSignatureEnvelopeId(
    id: UniqueEntityID,
    envelopeId: string | null,
    tenantId: string,
  ): Promise<void>;
}
