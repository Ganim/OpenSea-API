import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { EsocialCertificatesRepository } from '@/repositories/esocial/esocial-certificates-repository';
import { CheckCertificateExpiryUseCase } from './check-certificate-expiry';

describe('CheckCertificateExpiryUseCase', () => {
  let sut: CheckCertificateExpiryUseCase;
  let certificatesRepository: EsocialCertificatesRepository;

  beforeEach(() => {
    certificatesRepository = {
      findByTenantId: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    };

    sut = new CheckCertificateExpiryUseCase(certificatesRepository);
  });

  it('should return no certificate when none exists', async () => {
    vi.mocked(certificatesRepository.findByTenantId).mockResolvedValue(null);

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.hasCertificate).toBe(false);
    expect(result.isExpired).toBe(false);
    expect(result.isExpiringSoon).toBe(false);
    expect(result.daysUntilExpiry).toBeNull();
    expect(result.validUntil).toBeNull();
  });

  it('should return expiry info for valid certificate', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    vi.mocked(certificatesRepository.findByTenantId).mockResolvedValue({
      isExpired: vi.fn().mockReturnValue(false),
      isExpiringSoon: vi.fn().mockReturnValue(false),
      daysUntilExpiry: vi.fn().mockReturnValue(365),
      validUntil: futureDate,
    } as unknown);

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.hasCertificate).toBe(true);
    expect(result.isExpired).toBe(false);
    expect(result.isExpiringSoon).toBe(false);
    expect(result.daysUntilExpiry).toBe(365);
    expect(result.validUntil).toEqual(futureDate);
  });

  it('should detect expired certificate', async () => {
    const pastDate = new Date('2024-01-01');

    vi.mocked(certificatesRepository.findByTenantId).mockResolvedValue({
      isExpired: vi.fn().mockReturnValue(true),
      isExpiringSoon: vi.fn().mockReturnValue(false),
      daysUntilExpiry: vi.fn().mockReturnValue(-100),
      validUntil: pastDate,
    } as unknown);

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.isExpired).toBe(true);
  });

  it('should detect certificate expiring soon with custom warning days', async () => {
    vi.mocked(certificatesRepository.findByTenantId).mockResolvedValue({
      isExpired: vi.fn().mockReturnValue(false),
      isExpiringSoon: vi.fn().mockReturnValue(true),
      daysUntilExpiry: vi.fn().mockReturnValue(15),
      validUntil: new Date(),
    } as unknown);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      warningDays: 60,
    });

    expect(result.isExpiringSoon).toBe(true);
  });
});
