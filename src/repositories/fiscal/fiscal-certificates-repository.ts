import type { FiscalCertificate } from '@/entities/fiscal/fiscal-certificate';

export interface FiscalCertificatesRepository {
  findById(id: string): Promise<FiscalCertificate | null>;
  findByTenantId(tenantId: string): Promise<FiscalCertificate[]>;
  findExpiringSoon(daysAhead: number): Promise<FiscalCertificate[]>;
  create(certificate: FiscalCertificate): Promise<void>;
  save(certificate: FiscalCertificate): Promise<void>;
  delete(id: string): Promise<void>;
}
