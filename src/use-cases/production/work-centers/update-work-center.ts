import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WorkCentersRepository } from '@/repositories/production/work-centers-repository';

interface UpdateWorkCenterUseCaseRequest {
  tenantId: string;
  id: string;
  code?: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

interface UpdateWorkCenterUseCaseResponse {
  workCenter: import('@/entities/production/work-center').ProductionWorkCenter;
}

export class UpdateWorkCenterUseCase {
  constructor(private workCentersRepository: WorkCentersRepository) {}

  async execute({
    tenantId,
    id,
    code,
    name,
    description,
    isActive,
  }: UpdateWorkCenterUseCaseRequest): Promise<UpdateWorkCenterUseCaseResponse> {
    const workCenter = await this.workCentersRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!workCenter) {
      throw new ResourceNotFoundError('Work center not found.');
    }

    // Validate unique code if changed
    if (code && code !== workCenter.code) {
      const existingWorkCenter = await this.workCentersRepository.findByCode(
        code,
        tenantId,
      );

      if (existingWorkCenter && !existingWorkCenter.id.equals(workCenter.id)) {
        throw new BadRequestError(
          'A work center with this code already exists.',
        );
      }
    }

    const updatedWorkCenter = await this.workCentersRepository.update({
      id: new UniqueEntityID(id),
      code,
      name,
      description,
      isActive,
    });

    if (!updatedWorkCenter) {
      throw new ResourceNotFoundError('Work center not found.');
    }

    return {
      workCenter: updatedWorkCenter,
    };
  }
}
