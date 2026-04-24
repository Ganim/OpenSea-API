import type { PunchMissedLog } from '@/entities/hr/punch-missed-log';

/**
 * DTO público do PunchMissedLog (Phase 7 / Plan 07-03).
 *
 * Projeção LGPD-safe: intencionalmente NÃO expõe `cpf` nem outros identificadores
 * sensíveis. O gestor recebe `employeeName` + `departmentName` (display strings
 * resolvidas no use case) — suficientes para o card do dashboard, sem vazar PII
 * que o colaborador não precisa ver para aprovar a exceção.
 *
 * `resolutionType` só é populado quando Phase 9 ativa a feature de recuperação.
 */
export interface PunchMissedLogDTO {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string | null;
  date: string;
  expectedStartTime: string | null;
  generatedAt: string;
  resolvedAt: string | null;
  resolutionType:
    | 'LATE_PUNCH'
    | 'MANUAL_ADJUSTMENT'
    | 'JUSTIFIED_LEAVE'
    | 'IGNORED'
    | null;
}

export interface MissedLogDisplayContext {
  employeeName: string;
  departmentName: string | null;
}

export function punchMissedLogToDTO(
  entity: PunchMissedLog,
  display: MissedLogDisplayContext,
): PunchMissedLogDTO {
  return {
    id: entity.id.toString(),
    employeeId: entity.employeeId.toString(),
    employeeName: display.employeeName,
    departmentName: display.departmentName,
    date: entity.date.toISOString(),
    expectedStartTime: entity.expectedStartTime?.toISOString() ?? null,
    generatedAt: entity.generatedAt.toISOString(),
    resolvedAt: entity.resolvedAt?.toISOString() ?? null,
    resolutionType: entity.resolutionType,
  };
}
