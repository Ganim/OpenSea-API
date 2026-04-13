import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WorkCentersRepository } from '@/repositories/production/work-centers-repository';

interface DeleteWorkCenterUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteWorkCenterUseCaseResponse {
  message: string;
}

export class DeleteWorkCenterUseCase {
  constructor(private workCentersRepository: WorkCentersRepository) {}

  async execute({
    tenantId,
    id,
  }: DeleteWorkCenterUseCaseRequest): Promise<DeleteWorkCenterUseCaseResponse> {
    const workCenter = await this.workCentersRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!workCenter) {
      throw new ResourceNotFoundError('Work center not found.');
    }

    await this.workCentersRepository.delete(new UniqueEntityID(id));

    return {
      message: 'Work center deleted successfully.',
    };
  }
}
