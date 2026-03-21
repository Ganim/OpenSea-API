import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DigitalCertificate } from '@/entities/signature/digital-certificate';
import type { CertificateTypeValue, CertificateStatusValue } from '@/entities/signature/digital-certificate';
import type { DigitalCertificate as PrismaDigitalCertificate } from '@prisma/generated/client.js';

export function digitalCertificatePrismaToDomain(
  db: PrismaDigitalCertificate,
): DigitalCertificate {
  return DigitalCertificate.create(
    {
      id: new UniqueEntityID(db.id),
      tenantId: new UniqueEntityID(db.tenantId),
      name: db.name,
      type: db.type as CertificateTypeValue,
      status: db.status as CertificateStatusValue,
      subjectName: db.subjectName,
      subjectCnpj: db.subjectCnpj,
      subjectCpf: db.subjectCpf,
      issuerName: db.issuerName,
      serialNumber: db.serialNumber,
      validFrom: db.validFrom,
      validUntil: db.validUntil,
      thumbprint: db.thumbprint,
      pfxFileId: db.pfxFileId,
      pfxPassword: db.pfxPassword,
      cloudProviderId: db.cloudProviderId,
      alertDaysBefore: db.alertDaysBefore,
      isDefault: db.isDefault,
      allowedModules: db.allowedModules,
      lastUsedAt: db.lastUsedAt,
      createdAt: db.createdAt,
      updatedAt: db.updatedAt,
    },
    new UniqueEntityID(db.id),
  );
}
