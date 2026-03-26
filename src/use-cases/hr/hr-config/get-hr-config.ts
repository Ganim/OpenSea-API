import type { HrTenantConfig } from '@/entities/hr/hr-tenant-config';
import type { HrTenantConfigRepository } from '@/repositories/hr/hr-tenant-config-repository';

export interface GetHrConfigRequest {
  tenantId: string;
}

export interface GetHrConfigResponse {
  hrConfig: HrTenantConfig;
}

export class GetHrConfigUseCase {
  constructor(private hrConfigRepository: HrTenantConfigRepository) {}

  async execute(request: GetHrConfigRequest): Promise<GetHrConfigResponse> {
    const { tenantId } = request;

    let hrConfig = await this.hrConfigRepository.findByTenantId(tenantId);

    // Create default config if none exists
    if (!hrConfig) {
      hrConfig = await this.hrConfigRepository.create(tenantId);
    }

    return { hrConfig };
  }
}
