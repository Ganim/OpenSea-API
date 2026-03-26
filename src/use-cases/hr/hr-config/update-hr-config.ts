import type { HrTenantConfig } from '@/entities/hr/hr-tenant-config';
import type {
  HrTenantConfigRepository,
  UpdateHrTenantConfigData,
} from '@/repositories/hr/hr-tenant-config-repository';

export interface UpdateHrConfigRequest {
  tenantId: string;
  data: UpdateHrTenantConfigData;
}

export interface UpdateHrConfigResponse {
  hrConfig: HrTenantConfig;
}

export class UpdateHrConfigUseCase {
  constructor(private hrConfigRepository: HrTenantConfigRepository) {}

  async execute(
    request: UpdateHrConfigRequest,
  ): Promise<UpdateHrConfigResponse> {
    const { tenantId, data } = request;

    // Ensure config exists (create default if needed)
    const existing = await this.hrConfigRepository.findByTenantId(tenantId);
    if (!existing) {
      await this.hrConfigRepository.create(tenantId);
    }

    const hrConfig = await this.hrConfigRepository.update(tenantId, data);

    return { hrConfig };
  }
}
