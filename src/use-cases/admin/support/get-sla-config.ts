import {
  type SupportSlaConfigDTO,
  supportSlaConfigToDTO,
} from '@/mappers/core/support-sla-config-mapper';
import type { SupportSlaConfigsRepository } from '@/repositories/core/support-sla-configs-repository';

interface GetSlaConfigUseCaseResponse {
  slaConfigs: SupportSlaConfigDTO[];
}

export class GetSlaConfigUseCase {
  constructor(
    private supportSlaConfigsRepository: SupportSlaConfigsRepository,
  ) {}

  async execute(): Promise<GetSlaConfigUseCaseResponse> {
    const slaConfigs = await this.supportSlaConfigsRepository.findAll();

    return {
      slaConfigs: slaConfigs.map(supportSlaConfigToDTO),
    };
  }
}
