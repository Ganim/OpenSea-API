import type { WorkflowDTO } from '@/mappers/sales/workflow/workflow-to-dto';
import { workflowToDTO } from '@/mappers/sales/workflow/workflow-to-dto';
import { WorkflowsRepository } from '@/repositories/sales/workflows-repository';

interface ListWorkflowsUseCaseRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
}

interface ListWorkflowsUseCaseResponse {
  workflows: WorkflowDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListWorkflowsUseCase {
  constructor(private workflowsRepository: WorkflowsRepository) {}

  async execute(
    input: ListWorkflowsUseCaseRequest,
  ): Promise<ListWorkflowsUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;

    const [workflows, total] = await Promise.all([
      this.workflowsRepository.findMany(page, perPage, input.tenantId),
      this.workflowsRepository.countByTenant(input.tenantId),
    ]);

    return {
      workflows: workflows.map(workflowToDTO),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
