import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { TicketPriority } from '@/entities/core/support-ticket';
import {
  type SupportSlaConfigDTO,
  supportSlaConfigToDTO,
} from '@/mappers/core/support-sla-config-mapper';
import type { SupportSlaConfigsRepository } from '@/repositories/core/support-sla-configs-repository';

interface UpdateSlaConfigUseCaseRequest {
  priority: TicketPriority;
  firstResponseMinutes: number;
  resolutionMinutes: number;
}

interface UpdateSlaConfigUseCaseResponse {
  slaConfig: SupportSlaConfigDTO;
}

export class UpdateSlaConfigUseCase {
  constructor(
    private supportSlaConfigsRepository: SupportSlaConfigsRepository,
  ) {}

  async execute({
    priority,
    firstResponseMinutes,
    resolutionMinutes,
  }: UpdateSlaConfigUseCaseRequest): Promise<UpdateSlaConfigUseCaseResponse> {
    const slaConfig =
      await this.supportSlaConfigsRepository.findByPriority(priority);

    if (!slaConfig) {
      throw new ResourceNotFoundError(
        `SLA config for priority ${priority} not found`,
      );
    }

    slaConfig.firstResponseMinutes = firstResponseMinutes;
    slaConfig.resolutionMinutes = resolutionMinutes;

    await this.supportSlaConfigsRepository.save(slaConfig);

    return {
      slaConfig: supportSlaConfigToDTO(slaConfig),
    };
  }
}
