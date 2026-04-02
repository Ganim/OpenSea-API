import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { EsocialCertificatesRepository } from '@/repositories/esocial/esocial-certificates-repository';
import { UploadCertificateUseCase } from './upload-certificate';

describe('UploadCertificateUseCase', () => {
  let sut: UploadCertificateUseCase;
  let certificatesRepository: EsocialCertificatesRepository;

  beforeEach(() => {
    certificatesRepository = {
      findByTenantId: vi.fn(),
      create: vi.fn().mockResolvedValue({
        id: { toString: () => 'cert-1' },
        type: 'E_CNPJ',
      }),
      delete: vi.fn(),
    };

    sut = new UploadCertificateUseCase(certificatesRepository);
  });

  it('should throw BadRequestError for invalid certificate type', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        pfxData: Buffer.from('test'),
        passphrase: '1234',
        type: 'INVALID',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError for empty PFX data', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        pfxData: Buffer.alloc(0),
        passphrase: '1234',
        type: 'E_CNPJ',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should upload certificate successfully', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      pfxData: Buffer.from('pfx-content'),
      passphrase: 'secret',
      type: 'E_CNPJ',
    });

    expect(certificatesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        type: 'E_CNPJ',
        isActive: true,
      }),
    );
    expect(result.certificate).toBeDefined();
  });

  it('should accept E_CPF certificate type', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      pfxData: Buffer.from('pfx-content'),
      passphrase: 'secret',
      type: 'E_CPF',
    });

    expect(certificatesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'E_CPF' }),
    );
    expect(result.certificate).toBeDefined();
  });
});
