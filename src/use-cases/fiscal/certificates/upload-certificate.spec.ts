import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryFiscalCertificatesRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-certificates-repository';
import { InMemoryFiscalConfigsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-configs-repository';
import { UploadCertificateUseCase } from './upload-certificate';

let fiscalCertificatesRepository: InMemoryFiscalCertificatesRepository;
let fiscalConfigsRepository: InMemoryFiscalConfigsRepository;
let sut: UploadCertificateUseCase;

describe('Upload Certificate Use Case', () => {
  beforeEach(() => {
    fiscalCertificatesRepository = new InMemoryFiscalCertificatesRepository();
    fiscalConfigsRepository = new InMemoryFiscalConfigsRepository();
    sut = new UploadCertificateUseCase(
      fiscalCertificatesRepository,
      fiscalConfigsRepository,
    );
  });

  it('should upload a valid certificate', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const { certificate } = await sut.execute({
      tenantId: 'tenant-1',
      pfxBuffer: Buffer.from('fake-pfx-data'),
      pfxPassword: 'test-password',
      serialNumber: '1234567890',
      issuer: 'AC SOLUTI',
      subject: 'CN=Empresa Teste',
      validFrom: new Date(),
      validUntil: futureDate,
    });

    expect(certificate.serialNumber).toBe('1234567890');
    expect(certificate.status).toBe('ACTIVE');
    expect(certificate.isExpired()).toBe(false);
    expect(certificate.daysUntilExpiry()).toBeGreaterThan(360);
    expect(fiscalCertificatesRepository.items).toHaveLength(1);
  });

  it('should reject an expired certificate', async () => {
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        pfxBuffer: Buffer.from('fake-pfx-data'),
        pfxPassword: 'test-password',
        serialNumber: '1234567890',
        issuer: 'AC SOLUTI',
        subject: 'CN=Empresa Teste',
        validFrom: new Date('2020-01-01'),
        validUntil: pastDate,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
