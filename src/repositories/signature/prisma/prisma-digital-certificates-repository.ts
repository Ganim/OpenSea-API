import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { DigitalCertificate } from '@/entities/signature/digital-certificate';
import { prisma } from '@/lib/prisma';
import { digitalCertificatePrismaToDomain } from '@/mappers/signature';
import type {
  CertificateType,
  CertificateStatus,
} from '@prisma/generated/client.js';
import type {
  CreateDigitalCertificateSchema,
  DigitalCertificatesRepository,
  FindManyCertificatesResult,
  ListDigitalCertificatesParams,
} from '../digital-certificates-repository';

export class PrismaDigitalCertificatesRepository
  implements DigitalCertificatesRepository
{
  async create(
    data: CreateDigitalCertificateSchema,
  ): Promise<DigitalCertificate> {
    const db = await prisma.digitalCertificate.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        type: data.type as CertificateType,
        status: (data.status as CertificateStatus) ?? 'ACTIVE',
        subjectName: data.subjectName ?? null,
        subjectCnpj: data.subjectCnpj ?? null,
        subjectCpf: data.subjectCpf ?? null,
        issuerName: data.issuerName ?? null,
        serialNumber: data.serialNumber ?? null,
        validFrom: data.validFrom ?? null,
        validUntil: data.validUntil ?? null,
        thumbprint: data.thumbprint ?? null,
        pfxFileId: data.pfxFileId ?? null,
        pfxPassword: data.pfxPassword ?? null,
        cloudProviderId: data.cloudProviderId ?? null,
        alertDaysBefore: data.alertDaysBefore ?? 30,
        isDefault: data.isDefault ?? false,
        allowedModules: data.allowedModules ?? [],
      },
    });
    return digitalCertificatePrismaToDomain(db);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<DigitalCertificate | null> {
    const db = await prisma.digitalCertificate.findFirst({
      where: { id: id.toString(), tenantId },
    });
    return db ? digitalCertificatePrismaToDomain(db) : null;
  }

  async findMany(
    params: ListDigitalCertificatesParams,
  ): Promise<FindManyCertificatesResult> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);

    const where = {
      tenantId: params.tenantId,
      ...(params.status && { status: params.status as CertificateStatus }),
      ...(params.type && { type: params.type as CertificateType }),
      ...(params.search && {
        name: { contains: params.search, mode: 'insensitive' as const },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.digitalCertificate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.digitalCertificate.count({ where }),
    ]);

    return {
      certificates: items.map(digitalCertificatePrismaToDomain),
      total,
    };
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.digitalCertificate.delete({
      where: { id: id.toString() },
    });
  }
}
