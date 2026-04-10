import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PrintJob } from '@/entities/sales/print-job';

export interface PrintJobsRepository {
  create(job: PrintJob): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<PrintJob | null>;
  findManyByTenant(
    tenantId: string,
    filters?: {
      status?: string;
      printerId?: string;
      limit?: number;
      page?: number;
    },
  ): Promise<{ jobs: PrintJob[]; total: number }>;
  findPendingByPrinter(
    printerId: string,
    tenantId: string,
  ): Promise<PrintJob[]>;
  save(job: PrintJob): Promise<void>;
}
