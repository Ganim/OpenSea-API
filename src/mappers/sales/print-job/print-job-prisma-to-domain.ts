import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PrintJob } from '@/entities/sales/print-job';
import type { PrintJob as PrismaPrintJob } from '@prisma/generated/client.js';

export function printJobPrismaToDomain(raw: PrismaPrintJob): PrintJob {
  return PrintJob.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      printerId: new UniqueEntityID(raw.printerId),
      orderId: raw.orderId ?? undefined,
      type: raw.type,
      status: raw.status,
      content: raw.content,
      templateData: (raw.templateData as Record<string, unknown>) ?? undefined,
      errorMessage: raw.errorMessage ?? undefined,
      retryCount: raw.retryCount,
      maxRetries: raw.maxRetries,
      createdAt: raw.createdAt,
      completedAt: raw.completedAt ?? undefined,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}
