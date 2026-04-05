import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PrintJob } from '@/entities/sales/print-job';
import { prisma } from '@/lib/prisma';
import { printJobPrismaToDomain } from '@/mappers/sales/print-job/print-job-prisma-to-domain';
import type { PrintJobsRepository } from '../print-jobs-repository';
import type {
  PrintJobType as PrismaPrintJobType,
  PrintJobStatus as PrismaPrintJobStatus,
  Prisma,
} from '@prisma/generated/client.js';

export class PrismaPrintJobsRepository implements PrintJobsRepository {
  async create(job: PrintJob): Promise<void> {
    await prisma.printJob.create({
      data: {
        id: job.id.toString(),
        tenantId: job.tenantId.toString(),
        printerId: job.printerId.toString(),
        orderId: job.orderId ?? null,
        type: job.type as PrismaPrintJobType,
        status: job.status as PrismaPrintJobStatus,
        content: job.content,
        templateData:
          (job.templateData as Prisma.InputJsonValue | undefined) ?? undefined,
        errorMessage: job.errorMessage ?? null,
        retryCount: job.retryCount,
        maxRetries: job.maxRetries,
        createdAt: job.createdAt,
        completedAt: job.completedAt ?? null,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PrintJob | null> {
    const row = await prisma.printJob.findFirst({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    return row ? printJobPrismaToDomain(row) : null;
  }

  async save(job: PrintJob): Promise<void> {
    await prisma.printJob.update({
      where: {
        id: job.id.toString(),
      },
      data: {
        status: job.status as PrismaPrintJobStatus,
        errorMessage: job.errorMessage ?? null,
        retryCount: job.retryCount,
        completedAt: job.completedAt ?? null,
      },
    });
  }
}
