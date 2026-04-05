import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PrintJobsRepository } from '@/repositories/sales/print-jobs-repository';

interface CancelPrintJobUseCaseRequest {
  tenantId: string;
  jobId: string;
}

export class CancelPrintJobUseCase {
  constructor(private printJobsRepository: PrintJobsRepository) {}

  async execute(input: CancelPrintJobUseCaseRequest): Promise<void> {
    const job = await this.printJobsRepository.findById(
      new UniqueEntityID(input.jobId),
      input.tenantId,
    );

    if (!job) {
      throw new ResourceNotFoundError('Print job not found.');
    }

    job.status = 'CANCELLED';
    await this.printJobsRepository.save(job);
  }
}
