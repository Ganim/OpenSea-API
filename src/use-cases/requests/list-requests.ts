import type { Request } from '@/entities/requests/request';
import type {
  FindManyRequestsParams,
  RequestsRepository,
} from '@/repositories/requests/requests-repository';

interface ListRequestsUseCaseRequest extends FindManyRequestsParams {
  userId: string;
  hasViewAllPermission?: boolean;
}

interface ListRequestsUseCaseResponse {
  requests: Request[];
  total: number;
  page: number;
  limit: number;
}

export class ListRequestsUseCase {
  constructor(private requestsRepository: RequestsRepository) {}

  async execute(
    data: ListRequestsUseCaseRequest,
  ): Promise<ListRequestsUseCaseResponse> {
    const params: FindManyRequestsParams = {
      ...data,
      // Usuário sem permissão de ver todas só vê suas próprias requisições ou atribuídas a ele
      // Usamos userIdForOwnRequests para indicar ao repository que deve usar OR
      userIdForOwnRequests: !data.hasViewAllPermission
        ? data.userId
        : undefined,
      // Se tem permissão de ver todas, pode filtrar por requester/assignee específico
      requesterId: data.hasViewAllPermission ? data.requesterId : undefined,
      assignedToId: data.hasViewAllPermission ? data.assignedToId : undefined,
    };

    const [requests, total] = await Promise.all([
      this.requestsRepository.findMany(params),
      this.requestsRepository.countMany(params),
    ]);

    return {
      requests,
      total,
      page: data.page ?? 1,
      limit: data.limit ?? 20,
    };
  }
}
