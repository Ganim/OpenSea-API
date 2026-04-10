import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PrintJob } from '@/entities/sales/print-job';
import type { PosPrintersRepository } from '@/repositories/sales/pos-printers-repository';
import type { PrintJobsRepository } from '@/repositories/sales/print-jobs-repository';

const MAX_CONTENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

interface CreateLabelPrintJobUseCaseRequest {
  tenantId: string;
  printerId: string;
  content: string;
  copies?: number;
  templateData?: Record<string, unknown>;
}

interface CreateLabelPrintJobUseCaseResponse {
  jobId: string;
  status: 'queued';
}

export class CreateLabelPrintJobUseCase {
  constructor(
    private posPrintersRepository: PosPrintersRepository,
    private printJobsRepository: PrintJobsRepository,
  ) {}

  async execute(
    input: CreateLabelPrintJobUseCaseRequest,
  ): Promise<CreateLabelPrintJobUseCaseResponse> {
    const printer = await this.posPrintersRepository.findById(
      new UniqueEntityID(input.printerId),
      input.tenantId,
    );

    if (!printer) {
      throw new ResourceNotFoundError('Printer not found.');
    }

    const contentSizeBytes = Buffer.byteLength(input.content, 'utf-8');

    if (contentSizeBytes > MAX_CONTENT_SIZE_BYTES) {
      throw new BadRequestError(
        'Content exceeds maximum allowed size of 10MB.',
      );
    }

    const resolvedPrinterName = printer.osName ?? printer.name;

    const printJob = PrintJob.create({
      tenantId: new UniqueEntityID(input.tenantId),
      printerId: new UniqueEntityID(input.printerId),
      type: 'LABEL',
      status: 'QUEUED',
      content: input.content,
      copies: input.copies,
      printerName: resolvedPrinterName,
      templateData: input.templateData,
      agentId: printer.agentId,
    });

    await this.printJobsRepository.create(printJob);

    return { jobId: printJob.id.toString(), status: 'queued' };
  }
}
