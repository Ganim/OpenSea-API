import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PrintJob } from '@/entities/sales/print-job';

export interface PrintJobsRepository {
  create(job: PrintJob): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<PrintJob | null>;
  save(job: PrintJob): Promise<void>;
}
