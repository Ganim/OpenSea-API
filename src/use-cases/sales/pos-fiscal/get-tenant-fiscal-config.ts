import {
  type PosFiscalConfigDTO,
  posFiscalConfigToDTO,
} from '@/mappers/sales/pos-fiscal-config/pos-fiscal-config-to-dto';
import type { PosFiscalConfigsRepository } from '@/repositories/sales/pos-fiscal-configs-repository';

export interface GetTenantFiscalConfigRequest {
  tenantId: string;
}

export interface GetTenantFiscalConfigResponse {
  /**
   * `null` when the tenant has not configured the fiscal subsystem yet — the
   * frontend uses this signal to render the "first-time setup" panel
   * instead of an edit form.
   */
  fiscalConfig: PosFiscalConfigDTO | null;
}

/**
 * Fetches the singleton `PosFiscalConfig` for the requesting tenant
 * (Emporion Plan A — Task 32). Returns `null` when no configuration has
 * been persisted yet — this is *not* an error condition: tenants are bare
 * by default and the admin opt-in to fiscal emission via the companion
 * `UpdateTenantFiscalConfigUseCase`.
 *
 * Tenant isolation is enforced by the repository (`findByTenantId`).
 * Cross-tenant access is impossible because the use case never accepts an
 * id parameter.
 */
export class GetTenantFiscalConfigUseCase {
  constructor(private posFiscalConfigsRepository: PosFiscalConfigsRepository) {}

  async execute(
    request: GetTenantFiscalConfigRequest,
  ): Promise<GetTenantFiscalConfigResponse> {
    const fiscalConfig = await this.posFiscalConfigsRepository.findByTenantId(
      request.tenantId,
    );

    return {
      fiscalConfig: fiscalConfig ? posFiscalConfigToDTO(fiscalConfig) : null,
    };
  }
}
