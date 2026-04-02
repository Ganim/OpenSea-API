import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { EsocialCertificatesRepository } from '@/repositories/esocial/esocial-certificates-repository';
import { GetCertificateUseCase } from './get-certificate';

describe('GetCertificateUseCase', () => {
  let sut: GetCertificateUseCase;
  let certificatesRepository: EsocialCertificatesRepository;

  beforeEach(() => {
    certificatesRepository = {
      findByTenantId: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    };

    sut = new GetCertificateUseCase(certificatesRepository);
  });

  it('should return null when no certificate exists', async () => {
    vi.mocked(certificatesRepository.findByTenantId).mockResolvedValue(null);

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.certificate).toBeNull();
  });

  it('should return certificate when it exists', async () => {
    const mockCert = {
      id: { toString: () => 'cert-1' },
      type: 'E_CNPJ',
      serialNumber: 'SN-123',
    } as unknown;

    vi.mocked(certificatesRepository.findByTenantId).mockResolvedValue(
      mockCert,
    );

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.certificate).toBe(mockCert);
  });
});
