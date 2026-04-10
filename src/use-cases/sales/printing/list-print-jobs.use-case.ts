import type { PrintJob } from '@/entities/sales/print-job';
import type { PrintJobsRepository } from '@/repositories/sales/print-jobs-repository';

interface ListPrintJobsUseCaseRequest {
  tenantId: string;
  status?: string;
  printerId?: string;
  page?: number;
  limit?: number;
}

interface ListPrintJobsUseCaseResponse {
  jobs: PrintJob[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListPrintJobsUseCase {
  constructor(private printJobsRepository: PrintJobsRepository) {}

  async execute(
    input: ListPrintJobsUseCaseRequest,
  ): Promise<ListPrintJobsUseCaseResponse> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;

    const { jobs, total } = await this.printJobsRepository.findManyByTenant(
      input.tenantId,
      {
        status: input.status,
        printerId: input.printerId,
        page,
        limit,
      },
    );

    const pages = Math.ceil(total / limit);

    return { jobs, meta: { total, page, limit, pages } };
  }
}
