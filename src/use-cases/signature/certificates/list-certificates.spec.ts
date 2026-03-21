import { InMemoryDigitalCertificatesRepository } from '@/repositories/signature/in-memory/in-memory-digital-certificates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListCertificatesUseCase } from './list-certificates';

const TENANT_ID = 'tenant-1';

let certificatesRepository: InMemoryDigitalCertificatesRepository;
let sut: ListCertificatesUseCase;

describe('ListCertificatesUseCase', () => {
  beforeEach(() => {
    certificatesRepository = new InMemoryDigitalCertificatesRepository();
    sut = new ListCertificatesUseCase(certificatesRepository);
  });

  it('should list certificates for a tenant', async () => {
    await certificatesRepository.create({
      tenantId: TENANT_ID,
      name: 'Cert A',
      type: 'A1',
    });
    await certificatesRepository.create({
      tenantId: TENANT_ID,
      name: 'Cert B',
      type: 'CLOUD_NEOID',
    });

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.certificates).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pages).toBe(1);
  });

  it('should filter by type', async () => {
    await certificatesRepository.create({
      tenantId: TENANT_ID,
      name: 'Cert A1',
      type: 'A1',
    });
    await certificatesRepository.create({
      tenantId: TENANT_ID,
      name: 'Cloud Cert',
      type: 'CLOUD_NEOID',
    });

    const result = await sut.execute({ tenantId: TENANT_ID, type: 'A1' });

    expect(result.certificates).toHaveLength(1);
    expect(result.certificates[0].type).toBe('A1');
  });

  it('should not return certificates from another tenant', async () => {
    await certificatesRepository.create({
      tenantId: 'other-tenant',
      name: 'Other Cert',
      type: 'A1',
    });

    const result = await sut.execute({ tenantId: TENANT_ID });
    expect(result.certificates).toHaveLength(0);
  });
});
