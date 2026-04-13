import { DowntimeReasonsRepository } from '@/repositories/production/downtime-reasons-repository';

interface ListDowntimeReasonsUseCaseRequest {
  tenantId: string;
}

interface ListDowntimeReasonsUseCaseResponse {
  downtimeReasons: import('@/entities/production/downtime-reason').ProductionDowntimeReason[];
}

export class ListDowntimeReasonsUseCase {
  constructor(
    private downtimeReasonsRepository: DowntimeReasonsRepository,
  ) {}

  async execute({
    tenantId,
  }: ListDowntimeReasonsUseCaseRequest): Promise<ListDowntimeReasonsUseCaseResponse> {
    const downtimeReasons =
      await this.downtimeReasonsRepository.findMany(tenantId);

    return { downtimeReasons };
  }
}
