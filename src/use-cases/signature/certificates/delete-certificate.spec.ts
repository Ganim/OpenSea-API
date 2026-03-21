import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryDigitalCertificatesRepository } from '@/repositories/signature/in-memory/in-memory-digital-certificates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteCertificateUseCase } from './delete-certificate';

const TENANT_ID = 'tenant-1';

let certificatesRepository: InMemoryDigitalCertificatesRepository;
let sut: DeleteCertificateUseCase;

describe('DeleteCertificateUseCase', () => {
  beforeEach(() => {
    certificatesRepository = new InMemoryDigitalCertificatesRepository();
    sut = new DeleteCertificateUseCase(certificatesRepository);
  });

  it('should delete a certificate', async () => {
    const cert = await certificatesRepository.create({
      tenantId: TENANT_ID,
      name: 'Test Cert',
      type: 'A1',
    });

    await sut.execute({
      tenantId: TENANT_ID,
      certificateId: cert.id.toString(),
    });

    expect(certificatesRepository.items).toHaveLength(0);
  });

  it('should throw when certificate not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        certificateId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
