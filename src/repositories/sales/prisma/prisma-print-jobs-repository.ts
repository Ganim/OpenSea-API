import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PrintJob } from '@/entities/sales/print-job';
import { prisma } from '@/lib/prisma';
import { printJobPrismaToDomain } from '@/mappers/sales/print-job/print-job-prisma-to-domain';
import type {
  Prisma,
  PrintJobStatus as PrismaPrintJobStatus,
  PrintJobType as PrismaPrintJobType,
} from '@prisma/generated/client.js';
import type { PrintJobsRepository } from '../print-jobs-repository';

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
        agentId: job.agentId ?? null,
        copies: job.copies,
        printerName: job.printerName ?? null,
        labelData:
          (job.labelData as Prisma.InputJsonValue | undefined) ?? undefined,
        startedAt: job.startedAt ?? null,
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

  async findManyByTenant(
    tenantId: string,
    filters?: {
      status?: string;
      printerId?: string;
      limit?: number;
      page?: number;
    },
  ): Promise<{ jobs: PrintJob[]; total: number }> {
    const where: Prisma.PrintJobWhereInput = { tenantId };

    if (filters?.status) {
      where.status = filters.status as PrismaPrintJobStatus;
    }

    if (filters?.printerId) {
      where.printerId = filters.printerId;
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;

    const [rows, total] = await Promise.all([
      prisma.printJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.printJob.count({ where }),
    ]);

    return {
      jobs: rows.map(printJobPrismaToDomain),
      total,
    };
  }

  async findPendingByPrinter(
    printerId: string,
    tenantId: string,
  ): Promise<PrintJob[]> {
    const rows = await prisma.printJob.findMany({
      where: {
        printerId,
        tenantId,
        status: { in: ['CREATED', 'QUEUED'] },
      },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map(printJobPrismaToDomain);
  }

  async save(job: PrintJob): Promise<void> {
    await prisma.printJob.update({
      where: {
        id: job.id.toString(),
      },
      data: {
        status: job.status as PrismaPrintJobStatus,
        agentId: job.agentId ?? null,
        copies: job.copies,
        printerName: job.printerName ?? null,
        labelData:
          (job.labelData as Prisma.InputJsonValue | undefined) ?? undefined,
        startedAt: job.startedAt ?? null,
        errorMessage: job.errorMessage ?? null,
        retryCount: job.retryCount,
        completedAt: job.completedAt ?? null,
      },
    });
  }
}
