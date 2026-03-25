import {
  FiscalCertificate,
  type CertificateStatus,
} from '@/entities/fiscal/fiscal-certificate';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import type { FiscalCertificatesRepository } from '../fiscal-certificates-repository';

function toDomain(raw: Record<string, unknown>): FiscalCertificate {
  return FiscalCertificate.create(
    {
      id: new UniqueEntityID(raw.id as string),
      tenantId: new UniqueEntityID(raw.tenantId as string),
      pfxData: raw.pfxData as Buffer,
      pfxPassword: raw.pfxPassword as string,
      serialNumber: raw.serialNumber as string,
      issuer: raw.issuer as string,
      subject: raw.subject as string,
      validFrom: raw.validFrom as Date,
      validUntil: raw.validUntil as Date,
      status: raw.status as CertificateStatus,
      createdAt: raw.createdAt as Date,
      updatedAt: (raw.updatedAt as Date) ?? undefined,
    },
    new UniqueEntityID(raw.id as string),
  );
}

export class PrismaFiscalCertificatesRepository
  implements FiscalCertificatesRepository
{
  async findById(id: string): Promise<FiscalCertificate | null> {
    const certificateRecord = await prisma.fiscalCertificate.findUnique({
      where: { id },
    });

    return certificateRecord
      ? toDomain(certificateRecord as unknown as Record<string, unknown>)
      : null;
  }

  async findByTenantId(tenantId: string): Promise<FiscalCertificate[]> {
    const certificateRecords = await prisma.fiscalCertificate.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return certificateRecords.map((record) =>
      toDomain(record as unknown as Record<string, unknown>),
    );
  }

  async findExpiringSoon(daysAhead: number): Promise<FiscalCertificate[]> {
    const expirationThreshold = new Date();
    expirationThreshold.setDate(expirationThreshold.getDate() + daysAhead);

    const certificateRecords = await prisma.fiscalCertificate.findMany({
      where: {
        validUntil: { lt: expirationThreshold },
        status: 'ACTIVE',
      },
      orderBy: { validUntil: 'asc' },
    });

    return certificateRecords.map((record) =>
      toDomain(record as unknown as Record<string, unknown>),
    );
  }

  async create(certificate: FiscalCertificate): Promise<void> {
    await prisma.fiscalCertificate.create({
      data: {
        id: certificate.id.toString(),
        tenantId: certificate.tenantId.toString(),
        pfxData: certificate.pfxData,
        pfxPassword: certificate.pfxPassword,
        serialNumber: certificate.serialNumber,
        issuer: certificate.issuer,
        subject: certificate.subject,
        validFrom: certificate.validFrom,
        validUntil: certificate.validUntil,
        status: certificate.status,
        createdAt: certificate.createdAt,
      },
    });
  }

  async save(certificate: FiscalCertificate): Promise<void> {
    await prisma.fiscalCertificate.update({
      where: { id: certificate.id.toString() },
      data: {
        status: certificate.status,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.fiscalCertificate.delete({
      where: { id },
    });
  }
}
