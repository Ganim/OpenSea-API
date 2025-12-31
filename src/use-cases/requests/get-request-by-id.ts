import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Request } from '@/entities/requests/request';
import type { RequestsRepository } from '@/repositories/requests/requests-repository';

interface GetRequestByIdUseCaseRequest {
  requestId: string;
  userId: string;
  hasViewAllPermission?: boolean;
}

interface GetRequestByIdUseCaseResponse {
  request: Request;
}

export class GetRequestByIdUseCase {
  constructor(private requestsRepository: RequestsRepository) {}

  async execute(
    data: GetRequestByIdUseCaseRequest,
  ): Promise<GetRequestByIdUseCaseResponse> {
    const request = await this.requestsRepository.findById({
      toString: () => data.requestId,
    } as UniqueEntityID);

    if (!request) {
      throw new ResourceNotFoundError('Request not found');
    }

    if (!request.canBeViewedBy(data.userId, data.hasViewAllPermission)) {
      throw new BadRequestError(
        'You do not have permission to view this request',
      );
    }

    return { request };
  }
}
