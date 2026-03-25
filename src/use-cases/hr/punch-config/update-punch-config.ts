import type { PunchConfiguration } from '@/entities/hr/punch-configuration';
import type {
  PunchConfigRepository,
  UpdatePunchConfigData,
} from '@/repositories/hr/punch-config-repository';

export interface UpdatePunchConfigRequest {
  tenantId: string;
  data: UpdatePunchConfigData;
}

export interface UpdatePunchConfigResponse {
  punchConfig: PunchConfiguration;
}

export class UpdatePunchConfigUseCase {
  constructor(private punchConfigRepository: PunchConfigRepository) {}

  async execute(
    request: UpdatePunchConfigRequest,
  ): Promise<UpdatePunchConfigResponse> {
    const { tenantId, data } = request;

    // Ensure config exists (create default if needed)
    let existing = await this.punchConfigRepository.findByTenantId(tenantId);
    if (!existing) {
      await this.punchConfigRepository.create(tenantId);
    }

    const punchConfig = await this.punchConfigRepository.update(tenantId, data);

    return { punchConfig };
  }
}
