import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PrintJob } from '@/entities/sales/print-job';
import type { PrintJobsRepository } from '@/repositories/sales/print-jobs-repository';

interface RetryPrintJobUseCaseRequest {
  tenantId: string;
  jobId: string;
}

interface RetryPrintJobUseCaseResponse {
  jobId: string;
  status: 'queued';
}

export class RetryPrintJobUseCase {
  constructor(private printJobsRepository: PrintJobsRepository) {}

  async execute(
    input: RetryPrintJobUseCaseRequest,
  ): Promise<RetryPrintJobUseCaseResponse> {
    const failedJob = await this.printJobsRepository.findById(
      new UniqueEntityID(input.jobId),
      input.tenantId,
    );

    if (!failedJob) {
      throw new ResourceNotFoundError('Print job not found.');
    }

    if (failedJob.status !== 'FAILED') {
      throw new BadRequestError('Only failed print jobs can be retried.');
    }

    const retriedJob = PrintJob.create({
      tenantId: failedJob.tenantId,
      printerId: failedJob.printerId,
      orderId: failedJob.orderId,
      type: failedJob.type,
      status: 'QUEUED',
      content: failedJob.content,
      copies: failedJob.copies,
      printerName: failedJob.printerName,
      templateData: failedJob.templateData,
      agentId: failedJob.agentId,
      labelData: failedJob.labelData,
    });

    await this.printJobsRepository.create(retriedJob);

    return { jobId: retriedJob.id.toString(), status: 'queued' };
  }
}
