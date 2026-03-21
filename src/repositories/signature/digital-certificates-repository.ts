import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { DigitalCertificate } from '@/entities/signature/digital-certificate';

export interface CreateDigitalCertificateSchema {
  tenantId: string;
  name: string;
  type: string;
  status?: string;
  subjectName?: string | null;
  subjectCnpj?: string | null;
  subjectCpf?: string | null;
  issuerName?: string | null;
  serialNumber?: string | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  thumbprint?: string | null;
  pfxFileId?: string | null;
  pfxPassword?: string | null;
  cloudProviderId?: string | null;
  alertDaysBefore?: number;
  isDefault?: boolean;
  allowedModules?: string[];
}

export interface ListDigitalCertificatesParams {
  tenantId: string;
  status?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FindManyCertificatesResult {
  certificates: DigitalCertificate[];
  total: number;
}

export interface DigitalCertificatesRepository {
  create(data: CreateDigitalCertificateSchema): Promise<DigitalCertificate>;
  findById(id: UniqueEntityID, tenantId: string): Promise<DigitalCertificate | null>;
  findMany(params: ListDigitalCertificatesParams): Promise<FindManyCertificatesResult>;
  delete(id: UniqueEntityID): Promise<void>;
}
