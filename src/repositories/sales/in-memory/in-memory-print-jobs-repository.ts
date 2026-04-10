import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PrintJob } from '@/entities/sales/print-job';
import type { PrintJobsRepository } from '../print-jobs-repository';

export class InMemoryPrintJobsRepository implements PrintJobsRepository {
  public items: PrintJob[] = [];

  async create(job: PrintJob): Promise<void> {
    this.items.push(job);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PrintJob | null> {
    return (
      this.items.find(
        (job) =>
          job.id.toString() === id.toString() &&
          job.tenantId.toString() === tenantId,
      ) ?? null
    );
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
    let filtered = this.items.filter(
      (job) => job.tenantId.toString() === tenantId,
    );

    if (filters?.status) {
      filtered = filtered.filter((job) => job.status === filters.status);
    }

    if (filters?.printerId) {
      filtered = filtered.filter(
        (job) => job.printerId.toString() === filters.printerId,
      );
    }

    const total = filtered.length;
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const offset = (page - 1) * limit;

    const jobs = filtered.slice(offset, offset + limit);

    return { jobs, total };
  }

  async findPendingByPrinter(
    printerId: string,
    tenantId: string,
  ): Promise<PrintJob[]> {
    return this.items.filter(
      (job) =>
        job.printerId.toString() === printerId &&
        job.tenantId.toString() === tenantId &&
        (job.status === 'CREATED' || job.status === 'QUEUED'),
    );
  }

  async save(job: PrintJob): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === job.id.toString(),
    );

    if (index >= 0) {
      this.items[index] = job;
    }
  }
}
