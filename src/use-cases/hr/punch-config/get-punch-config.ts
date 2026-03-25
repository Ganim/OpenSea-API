import type { PunchConfiguration } from '@/entities/hr/punch-configuration';
import type { PunchConfigRepository } from '@/repositories/hr/punch-config-repository';

export interface GetPunchConfigRequest {
  tenantId: string;
}

export interface GetPunchConfigResponse {
  punchConfig: PunchConfiguration;
}

export class GetPunchConfigUseCase {
  constructor(private punchConfigRepository: PunchConfigRepository) {}

  async execute(
    request: GetPunchConfigRequest,
  ): Promise<GetPunchConfigResponse> {
    const { tenantId } = request;

    let punchConfig = await this.punchConfigRepository.findByTenantId(tenantId);

    // Create default config if none exists
    if (!punchConfig) {
      punchConfig = await this.punchConfigRepository.create(tenantId);
    }

    return { punchConfig };
  }
}
