import { InMemoryDigitalCertificatesRepository } from '@/repositories/signature/in-memory/in-memory-digital-certificates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UploadCertificateUseCase } from './upload-certificate';

const TENANT_ID = 'tenant-1';

let certificatesRepository: InMemoryDigitalCertificatesRepository;
let sut: UploadCertificateUseCase;

describe('UploadCertificateUseCase', () => {
  beforeEach(() => {
    certificatesRepository = new InMemoryDigitalCertificatesRepository();
    sut = new UploadCertificateUseCase(certificatesRepository);
  });

  it('should upload a new certificate', async () => {
    const { certificate } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Certificado e-CNPJ Principal',
      type: 'A1',
      subjectName: 'EMPRESA XYZ LTDA',
      subjectCnpj: '12345678000190',
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2027-01-01'),
    });

    expect(certificate).toBeDefined();
    expect(certificate.name).toBe('Certificado e-CNPJ Principal');
    expect(certificate.type).toBe('A1');
    expect(certificate.status).toBe('ACTIVE');
    expect(certificate.subjectCnpj).toBe('12345678000190');
    expect(certificatesRepository.items).toHaveLength(1);
  });

  it('should set default values', async () => {
    const { certificate } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Cloud Certificate',
      type: 'CLOUD_NEOID',
    });

    expect(certificate.alertDaysBefore).toBe(30);
    expect(certificate.isDefault).toBe(false);
    expect(certificate.allowedModules).toEqual([]);
  });
});
