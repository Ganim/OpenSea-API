import type { ComplianceVerifyLog } from '@/entities/hr/compliance-public-verify-log';

/**
 * Repositório do log de consultas públicas (Plan 06-03).
 *
 * Append-only. `count` serve para detecção de abuse (ex: 100 hits do mesmo
 * nsrHash em 1 hora pode disparar alerta no Plan 9 antifraude).
 */
export interface ComplianceVerifyLogRepository {
  create(log: ComplianceVerifyLog): Promise<void>;

  /**
   * Conta hits de um nsrHash desde `since`. Inclui FOUND / NOT_FOUND /
   * RATE_LIMITED — todos contam para abuse. Não filtra por tenantId
   * porque RATE_LIMITED não tem tenantId resolvido.
   */
  countByNsrHashSince(nsrHash: string, since: Date): Promise<number>;
}
