import type { AiActionLogsRepository } from '@/repositories/ai/ai-action-logs-repository';

interface ListActionLogsRequest {
  tenantId: string;
  userId?: string;
  status?: string;
  targetModule?: string;
  page?: number;
  limit?: number;
}

export class ListActionLogsUseCase {
  constructor(private actionLogsRepository: AiActionLogsRepository) {}

  async execute(request: ListActionLogsRequest) {
    const page = request.page ?? 1;
    const limit = Math.min(request.limit ?? 20, 100);

    const { actions, total } = await this.actionLogsRepository.findMany({
      tenantId: request.tenantId,
      userId: request.userId,
      status: request.status,
      targetModule: request.targetModule,
      page,
      limit,
    });

    return {
      actions,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
