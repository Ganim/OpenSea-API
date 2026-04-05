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

  async save(job: PrintJob): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === job.id.toString(),
    );

    if (index >= 0) {
      this.items[index] = job;
    }
  }
}
