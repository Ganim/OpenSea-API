import type { EsocialConfig } from '@/entities/esocial/esocial-config';

export interface UpdateEsocialConfigData {
  environment?: string;
  version?: string;
  tpInsc?: number;
  nrInsc?: string | null;
  /**
   * Phase 06 Plan 06-06 — Número INPI (REP-P), 17 dígitos. null para limpar
   * explicitamente; undefined para não tocar no valor existente.
   */
  inpiNumber?: string | null;
  autoGenerateOnAdmission?: boolean;
  autoGenerateOnTermination?: boolean;
  autoGenerateOnLeave?: boolean;
  autoGenerateOnPayroll?: boolean;
  requireApproval?: boolean;
}

export interface EsocialConfigRepository {
  findByTenantId(tenantId: string): Promise<EsocialConfig | null>;
  upsert(
    tenantId: string,
    data: UpdateEsocialConfigData,
  ): Promise<EsocialConfig>;
}
