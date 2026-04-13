import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DowntimeReasonsRepository } from '@/repositories/production/downtime-reasons-repository';

interface DeleteDowntimeReasonUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteDowntimeReasonUseCaseResponse {
  message: string;
}

export class DeleteDowntimeReasonUseCase {
  constructor(
    private downtimeReasonsRepository: DowntimeReasonsRepository,
  ) {}

  async execute({
    tenantId,
    id,
  }: DeleteDowntimeReasonUseCaseRequest): Promise<DeleteDowntimeReasonUseCaseResponse> {
    const existing = await this.downtimeReasonsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Downtime reason not found.');
    }

    await this.downtimeReasonsRepository.delete(new UniqueEntityID(id));

    return { message: 'Downtime reason deleted successfully.' };
  }
}
