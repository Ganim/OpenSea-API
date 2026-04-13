import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { ProductionDowntimeReasonCategory } from '@/entities/production/downtime-reason';
import { DowntimeReasonsRepository } from '@/repositories/production/downtime-reasons-repository';

interface CreateDowntimeReasonUseCaseRequest {
  tenantId: string;
  code: string;
  name: string;
  category: ProductionDowntimeReasonCategory;
  isActive?: boolean;
}

interface CreateDowntimeReasonUseCaseResponse {
  downtimeReason: import('@/entities/production/downtime-reason').ProductionDowntimeReason;
}

export class CreateDowntimeReasonUseCase {
  constructor(private downtimeReasonsRepository: DowntimeReasonsRepository) {}

  async execute({
    tenantId,
    code,
    name,
    category,
    isActive,
  }: CreateDowntimeReasonUseCaseRequest): Promise<CreateDowntimeReasonUseCaseResponse> {
    // Validate unique code per tenant
    const existingByCode = await this.downtimeReasonsRepository.findByCode(
      code,
      tenantId,
    );

    if (existingByCode) {
      throw new BadRequestError(
        'A downtime reason with this code already exists.',
      );
    }

    const downtimeReason = await this.downtimeReasonsRepository.create({
      tenantId,
      code,
      name,
      category,
      isActive,
    });

    return { downtimeReason };
  }
}
