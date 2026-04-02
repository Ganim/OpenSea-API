import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EsocialCertificate } from '@/entities/esocial/esocial-certificate';
import { prisma } from '@/lib/prisma';
import type {
  CreateEsocialCertificateData,
  EsocialCertificatesRepository,
} from '../esocial-certificates-repository';

export class PrismaEsocialCertificatesRepository
  implements EsocialCertificatesRepository
{
  async findByTenantId(tenantId: string): Promise<EsocialCertificate | null> {
    const data = await prisma.esocialCertificate.findUnique({
      where: { tenantId },
    });

    if (!data) return null;

    return EsocialCertificate.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        type: 'E_CNPJ', // Not stored in current schema; default value
        serialNumber: data.serialNumber,
        issuer: data.issuer,
        subject: data.subject,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        pfxData: Buffer.from(data.encryptedPfx),
        passphrase: '', // Passphrase not stored separately in current schema
        isActive: true, // Not stored in current schema; default value
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      new UniqueEntityID(data.id),
    );
  }

  async create(
    data: CreateEsocialCertificateData,
  ): Promise<EsocialCertificate> {
    // Delete existing certificate if any (one per tenant)
    await prisma.esocialCertificate.deleteMany({
      where: { tenantId: data.tenantId },
    });

    const result = await prisma.esocialCertificate.create({
      data: {
        tenantId: data.tenantId,
        serialNumber: data.serialNumber,
        issuer: data.issuer,
        subject: data.subject,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        encryptedPfx: data.pfxData,
        encryptionIv:
          (data as unknown as Record<string, string>).encryptionIv ?? '',
        encryptionTag:
          (data as unknown as Record<string, string>).encryptionTag ?? '',
      },
    });

    return EsocialCertificate.create(
      {
        tenantId: new UniqueEntityID(result.tenantId),
        type: 'E_CNPJ',
        serialNumber: result.serialNumber,
        issuer: result.issuer,
        subject: result.subject,
        validFrom: result.validFrom,
        validUntil: result.validUntil,
        pfxData: Buffer.from(result.encryptedPfx),
        passphrase: '',
        isActive: true,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      },
      new UniqueEntityID(result.id),
    );
  }

  async delete(tenantId: string): Promise<void> {
    await prisma.esocialCertificate.deleteMany({
      where: { tenantId },
    });
  }
}
