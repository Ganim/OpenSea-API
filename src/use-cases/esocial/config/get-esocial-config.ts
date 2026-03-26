import { EsocialConfig } from '@/entities/esocial/esocial-config';
import type { EsocialConfigRepository } from '@/repositories/esocial/esocial-config-repository';

export interface GetEsocialConfigRequest {
  tenantId: string;
}

export interface GetEsocialConfigResponse {
  config: EsocialConfig;
}

/**
 * Get eSocial config for a tenant.
 * Auto-creates a default config if none exists.
 */
export class GetEsocialConfigUseCase {
  constructor(private configRepository: EsocialConfigRepository) {}

  async execute(
    request: GetEsocialConfigRequest,
  ): Promise<GetEsocialConfigResponse> {
    let config = await this.configRepository.findByTenantId(request.tenantId);

    if (!config) {
      config = await this.configRepository.upsert(request.tenantId, {});
    }

    return { config };
  }
}
