import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DowntimeReasonsRepository } from '@/repositories/production/downtime-reasons-repository';

interface GetDowntimeReasonByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetDowntimeReasonByIdUseCaseResponse {
  downtimeReason: import('@/entities/production/downtime-reason').ProductionDowntimeReason;
}

export class GetDowntimeReasonByIdUseCase {
  constructor(private downtimeReasonsRepository: DowntimeReasonsRepository) {}

  async execute({
    tenantId,
    id,
  }: GetDowntimeReasonByIdUseCaseRequest): Promise<GetDowntimeReasonByIdUseCaseResponse> {
    const downtimeReason = await this.downtimeReasonsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!downtimeReason) {
      throw new ResourceNotFoundError('Downtime reason not found.');
    }

    return { downtimeReason };
  }
}
