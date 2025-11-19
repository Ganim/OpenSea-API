import type { Request } from '@/entities/requests/request';
import type {
  FindManyRequestsParams,
  RequestsRepository,
} from '@/repositories/requests/requests-repository';

interface ListRequestsUseCaseRequest extends FindManyRequestsParams {
  userId: string;
  userRole: 'ADMIN' | 'MANAGER' | 'USER';
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
      // Usuário comum só vê suas próprias requisições ou atribuídas a ele
      requesterId: data.userRole === 'USER' ? data.userId : data.requesterId,
      assignedToId: data.userRole === 'USER' ? data.userId : data.assignedToId,
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
