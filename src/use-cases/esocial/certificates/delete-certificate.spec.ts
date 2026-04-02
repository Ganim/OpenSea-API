import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { EsocialCertificatesRepository } from '@/repositories/esocial/esocial-certificates-repository';
import { DeleteCertificateUseCase } from './delete-certificate';

describe('DeleteCertificateUseCase', () => {
  let sut: DeleteCertificateUseCase;
  let certificatesRepository: EsocialCertificatesRepository;

  beforeEach(() => {
    certificatesRepository = {
      findByTenantId: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    };

    sut = new DeleteCertificateUseCase(certificatesRepository);
  });

  it('should throw ResourceNotFoundError if no certificate exists', async () => {
    vi.mocked(certificatesRepository.findByTenantId).mockResolvedValue(null);

    await expect(sut.execute({ tenantId: 'tenant-1' })).rejects.toBeInstanceOf(
      ResourceNotFoundError,
    );
  });

  it('should delete certificate successfully', async () => {
    vi.mocked(certificatesRepository.findByTenantId).mockResolvedValue({
      id: { toString: () => 'cert-1' },
    } as unknown);

    await sut.execute({ tenantId: 'tenant-1' });

    expect(certificatesRepository.delete).toHaveBeenCalledWith('tenant-1');
  });
});
