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
        type: data.type,
        serialNumber: data.serialNumber,
        issuer: data.issuer,
        subject: data.subject,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        pfxData: Buffer.from(data.pfxData),
        passphrase: data.passphrase,
        isActive: data.isActive,
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
        type: data.type,
        serialNumber: data.serialNumber,
        issuer: data.issuer,
        subject: data.subject,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        pfxData: data.pfxData,
        passphrase: data.passphrase,
        isActive: data.isActive ?? true,
      },
    });

    return EsocialCertificate.create(
      {
        tenantId: new UniqueEntityID(result.tenantId),
        type: result.type,
        serialNumber: result.serialNumber,
        issuer: result.issuer,
        subject: result.subject,
        validFrom: result.validFrom,
        validUntil: result.validUntil,
        pfxData: Buffer.from(result.pfxData),
        passphrase: result.passphrase,
        isActive: result.isActive,
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
