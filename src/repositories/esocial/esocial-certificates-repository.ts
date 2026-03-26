import type { EsocialCertificate } from '@/entities/esocial/esocial-certificate';

export interface CreateEsocialCertificateData {
  tenantId: string;
  type: string;
  serialNumber: string;
  issuer: string;
  subject: string;
  validFrom: Date;
  validUntil: Date;
  pfxData: Buffer;
  passphrase: string;
  isActive?: boolean;
}

export interface EsocialCertificatesRepository {
  findByTenantId(tenantId: string): Promise<EsocialCertificate | null>;
  create(data: CreateEsocialCertificateData): Promise<EsocialCertificate>;
  delete(tenantId: string): Promise<void>;
}
