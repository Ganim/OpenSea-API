import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Prisma } from '@prisma/generated/client.js';

export function mapGeneratedEmploymentContractPrismaToDomain(
  contractDb: Prisma.GeneratedEmploymentContractGetPayload<{
    include: Record<string, never>;
  }>,
) {
  return {
    tenantId: new UniqueEntityID(contractDb.tenantId),
    templateId: new UniqueEntityID(contractDb.templateId),
    employeeId: new UniqueEntityID(contractDb.employeeId),
    generatedBy: new UniqueEntityID(contractDb.generatedBy),
    storageFileId: contractDb.storageFileId
      ? new UniqueEntityID(contractDb.storageFileId)
      : undefined,
    pdfUrl: contractDb.pdfUrl ?? undefined,
    pdfKey: contractDb.pdfKey ?? undefined,
    variables: (contractDb.variables ?? {}) as Record<string, unknown>,
    createdAt: contractDb.createdAt,
  };
}
