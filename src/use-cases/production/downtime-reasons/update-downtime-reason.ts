import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionDowntimeReasonCategory } from '@/entities/production/downtime-reason';
import { DowntimeReasonsRepository } from '@/repositories/production/downtime-reasons-repository';

interface UpdateDowntimeReasonUseCaseRequest {
  tenantId: string;
  id: string;
  code?: string;
  name?: string;
  category?: ProductionDowntimeReasonCategory;
  isActive?: boolean;
}

interface UpdateDowntimeReasonUseCaseResponse {
  downtimeReason: import('@/entities/production/downtime-reason').ProductionDowntimeReason;
}

export class UpdateDowntimeReasonUseCase {
  constructor(
    private downtimeReasonsRepository: DowntimeReasonsRepository,
  ) {}

  async execute({
    tenantId,
    id,
    code,
    name,
    category,
    isActive,
  }: UpdateDowntimeReasonUseCaseRequest): Promise<UpdateDowntimeReasonUseCaseResponse> {
    const existing = await this.downtimeReasonsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Downtime reason not found.');
    }

    // Validate unique code if being changed
    if (code && code !== existing.code) {
      const existingByCode = await this.downtimeReasonsRepository.findByCode(
        code,
        tenantId,
      );

      if (existingByCode && !existingByCode.id.equals(existing.id)) {
        throw new BadRequestError(
          'A downtime reason with this code already exists.',
        );
      }
    }

    const updated = await this.downtimeReasonsRepository.update({
      id: new UniqueEntityID(id),
      code,
      name,
      category,
      isActive,
    });

    if (!updated) {
      throw new ResourceNotFoundError('Downtime reason not found.');
    }

    return { downtimeReason: updated };
  }
}
