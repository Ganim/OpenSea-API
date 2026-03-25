import type { FiscalCertificate } from '@/entities/fiscal/fiscal-certificate';
import type { FiscalCertificatesRepository } from '../fiscal-certificates-repository';

export class InMemoryFiscalCertificatesRepository
  implements FiscalCertificatesRepository
{
  public items: FiscalCertificate[] = [];

  async findById(id: string): Promise<FiscalCertificate | null> {
    const certificate = this.items.find((item) => item.id.toString() === id);
    return certificate ?? null;
  }

  async findByTenantId(tenantId: string): Promise<FiscalCertificate[]> {
    return this.items.filter((item) => item.tenantId.toString() === tenantId);
  }

  async findExpiringSoon(daysAhead: number): Promise<FiscalCertificate[]> {
    return this.items.filter(
      (item) =>
        item.status === 'ACTIVE' &&
        item.daysUntilExpiry() <= daysAhead &&
        item.daysUntilExpiry() > 0,
    );
  }

  async create(certificate: FiscalCertificate): Promise<void> {
    this.items.push(certificate);
  }

  async save(certificate: FiscalCertificate): Promise<void> {
    const index = this.items.findIndex((item) =>
      item.id.equals(certificate.id),
    );
    if (index >= 0) {
      this.items[index] = certificate;
    } else {
      this.items.push(certificate);
    }
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id.toString() !== id);
  }
}
