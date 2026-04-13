import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { WorkCentersRepository } from '@/repositories/production/work-centers-repository';

interface CreateWorkCenterUseCaseRequest {
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

interface CreateWorkCenterUseCaseResponse {
  workCenter: import('@/entities/production/work-center').ProductionWorkCenter;
}

export class CreateWorkCenterUseCase {
  constructor(private workCentersRepository: WorkCentersRepository) {}

  async execute({
    tenantId,
    code,
    name,
    description,
    isActive = true,
  }: CreateWorkCenterUseCaseRequest): Promise<CreateWorkCenterUseCaseResponse> {
    const existingWorkCenter = await this.workCentersRepository.findByCode(
      code,
      tenantId,
    );

    if (existingWorkCenter) {
      throw new BadRequestError('A work center with this code already exists.');
    }

    const workCenter = await this.workCentersRepository.create({
      tenantId,
      code,
      name,
      description,
      isActive,
    });

    return {
      workCenter,
    };
  }
}
