import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import type { AuditMessage } from './types';

/**
 * Mensagens de auditoria do módulo HR (Recursos Humanos)
 *
 * Inclui: Employees, Departments, Positions, Time Control, Absences,
 * Vacation Periods, Overtime, Time Bank, Payrolls, Bonuses, Deductions,
 * Work Schedules, Companies, Company Addresses, CNAEs, Fiscal Settings,
 * Stakeholders, Manufacturers, Suppliers
 */
export const HR_AUDIT_MESSAGES = {
  // ============================================================================
  // EMPLOYEES - Gestão de funcionários
  // ============================================================================

  /** Novo funcionário cadastrado */
  EMPLOYEE_CREATE: {
    action: AuditAction.EMPLOYEE_HIRE,
    entity: AuditEntity.EMPLOYEE,
    module: AuditModule.HR,
    description: '{{userName}} cadastrou o funcionário {{employeeName}}',
  } satisfies AuditMessage,

  /** Funcionário cadastrado com usuário vinculado */
  EMPLOYEE_CREATE_WITH_USER: {
    action: AuditAction.EMPLOYEE_HIRE,
    entity: AuditEntity.EMPLOYEE,
    module: AuditModule.HR,
    description:
      '{{userName}} cadastrou o funcionário {{employeeName}} com acesso ao sistema',
  } satisfies AuditMessage,

  /** Dados do funcionário atualizados */
  EMPLOYEE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.EMPLOYEE,
    module: AuditModule.HR,
    description: '{{userName}} atualizou os dados de {{employeeName}}',
  } satisfies AuditMessage,

  /** Funcionário excluído */
  EMPLOYEE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.EMPLOYEE,
    module: AuditModule.HR,
    description: '{{userName}} excluiu o cadastro de {{employeeName}}',
  } satisfies AuditMessage,

  /** Funcionário desligado */
  EMPLOYEE_TERMINATE: {
    action: AuditAction.EMPLOYEE_TERMINATE,
    entity: AuditEntity.EMPLOYEE,
    module: AuditModule.HR,
    description: '{{userName}} registrou desligamento de {{employeeName}}',
  } satisfies AuditMessage,

  /** Funcionário transferido */
  EMPLOYEE_TRANSFER: {
    action: AuditAction.EMPLOYEE_TRANSFER,
    entity: AuditEntity.EMPLOYEE,
    module: AuditModule.HR,
    description:
      '{{userName}} transferiu {{employeeName}} de {{oldDepartment}} para {{newDepartment}}',
  } satisfies AuditMessage,

  /** Usuário vinculado ao funcionário */
  EMPLOYEE_LINK_USER: {
    action: AuditAction.EMPLOYEE_LINK_USER,
    entity: AuditEntity.EMPLOYEE,
    module: AuditModule.HR,
    description:
      '{{userName}} vinculou o usuário {{userName}} ao funcionário {{employeeName}}',
  } satisfies AuditMessage,

  /** Usuário desvinculado do funcionário */
  EMPLOYEE_UNLINK_USER: {
    action: AuditAction.EMPLOYEE_UNLINK_USER,
    entity: AuditEntity.EMPLOYEE,
    module: AuditModule.HR,
    description:
      '{{userName}} desvinculou o usuário do funcionário {{employeeName}}',
  } satisfies AuditMessage,

  /** Funcionário suspenso */
  EMPLOYEE_SUSPEND: {
    action: AuditAction.EMPLOYEE_SUSPEND,
    entity: AuditEntity.EMPLOYEE,
    module: AuditModule.HR,
    description: '{{adminName}} suspendeu o funcionário {{employeeName}}',
  } satisfies AuditMessage,

  /** Funcionário reativado */
  EMPLOYEE_REACTIVATE: {
    action: AuditAction.EMPLOYEE_REACTIVATE,
    entity: AuditEntity.EMPLOYEE,
    module: AuditModule.HR,
    description: '{{adminName}} reativou o funcionário {{employeeName}}',
  } satisfies AuditMessage,

  /** Funcionário colocado em licença */
  EMPLOYEE_ON_LEAVE: {
    action: AuditAction.EMPLOYEE_ON_LEAVE,
    entity: AuditEntity.EMPLOYEE,
    module: AuditModule.HR,
    description:
      '{{adminName}} registrou licença para o funcionário {{employeeName}}',
  } satisfies AuditMessage,

  /** Funcionário anonimizado (LGPD Art. 18 VI) */
  EMPLOYEE_ANONYMIZED: {
    action: AuditAction.EMPLOYEE_ANONYMIZED,
    entity: AuditEntity.EMPLOYEE,
    module: AuditModule.HR,
    description:
      '{{adminName}} anonimizou os dados pessoais do funcionário {{employeeName}} (LGPD Art. 18 VI)',
  } satisfies AuditMessage,

  /** ShortId público do funcionário regenerado (Emporion POS operator login) */
  EMPLOYEE_REGENERATE_SHORT_ID: {
    action: AuditAction.EMPLOYEE_REGENERATE_SHORT_ID,
    entity: AuditEntity.EMPLOYEE,
    module: AuditModule.HR,
    description:
      '{{adminName}} regenerou o shortId público de {{employeeName}}',
  } satisfies AuditMessage,

  /** Verificação de CPF */
  EMPLOYEE_CHECK_CPF: {
    action: AuditAction.CHECK_CPF,
    entity: AuditEntity.EMPLOYEE,
    module: AuditModule.HR,
    description: '{{userName}} verificou o CPF {{cpf}}',
  } satisfies AuditMessage,

  // ============================================================================
  // DEPARTMENTS - Gestão de departamentos
  // ============================================================================

  /** Novo departamento criado */
  DEPARTMENT_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.DEPARTMENT,
    module: AuditModule.HR,
    description: '{{userName}} criou o departamento {{departmentName}}',
  } satisfies AuditMessage,

  /** Departamento atualizado */
  DEPARTMENT_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.DEPARTMENT,
    module: AuditModule.HR,
    description: '{{userName}} atualizou o departamento {{departmentName}}',
  } satisfies AuditMessage,

  /** Departamento excluído */
  DEPARTMENT_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.DEPARTMENT,
    module: AuditModule.HR,
    description: '{{userName}} excluiu o departamento {{departmentName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // POSITIONS - Gestão de cargos
  // ============================================================================

  /** Novo cargo criado */
  POSITION_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.POSITION,
    module: AuditModule.HR,
    description: '{{userName}} criou o cargo {{positionName}}',
  } satisfies AuditMessage,

  /** Cargo atualizado */
  POSITION_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.POSITION,
    module: AuditModule.HR,
    description: '{{userName}} atualizou o cargo {{positionName}}',
  } satisfies AuditMessage,

  /** Cargo excluído */
  POSITION_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.POSITION,
    module: AuditModule.HR,
    description: '{{userName}} excluiu o cargo {{positionName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // TIME CONTROL - Controle de ponto
  // ============================================================================

  /** Registro de entrada */
  TIME_CLOCK_IN: {
    action: AuditAction.CLOCK_IN,
    entity: AuditEntity.TIME_ENTRY,
    module: AuditModule.HR,
    description: '{{employeeName}} registrou entrada às {{time}}',
  } satisfies AuditMessage,

  /** Registro de saída */
  TIME_CLOCK_OUT: {
    action: AuditAction.CLOCK_OUT,
    entity: AuditEntity.TIME_ENTRY,
    module: AuditModule.HR,
    description: '{{employeeName}} registrou saída às {{time}}',
  } satisfies AuditMessage,

  /** Cálculo de horas trabalhadas */
  TIME_CALCULATE: {
    action: AuditAction.TIME_CALCULATE,
    entity: AuditEntity.TIME_ENTRY,
    module: AuditModule.HR,
    description:
      '{{userName}} calculou horas trabalhadas de {{employeeName}} no período {{period}}',
  } satisfies AuditMessage,

  // ============================================================================
  // PUNCH CONFIGURATION - Configuração de ponto
  // ============================================================================

  /** Configuração de ponto atualizada */
  PUNCH_CONFIG_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PUNCH_CONFIGURATION,
    module: AuditModule.HR,
    description: '{{userName}} atualizou a configuração de ponto',
  } satisfies AuditMessage,

  // ============================================================================
  // PUNCH DEVICES - Dispositivos de ponto (v2.0 — kiosk, PWA, biométrico)
  // ============================================================================

  /** Dispositivo de ponto cadastrado */
  PUNCH_DEVICE_CREATED: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PUNCH_DEVICE,
    module: AuditModule.HR,
    description:
      '{{userName}} cadastrou o dispositivo de ponto {{deviceName}} ({{deviceKind}})',
  } satisfies AuditMessage,

  /** Dispositivo de ponto pareado */
  PUNCH_DEVICE_PAIRED: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PUNCH_DEVICE,
    module: AuditModule.HR,
    description:
      '{{userName}} pareou o dispositivo {{deviceName}} ({{hostname}})',
  } satisfies AuditMessage,

  /** Dispositivo de ponto revogado */
  PUNCH_DEVICE_REVOKED: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PUNCH_DEVICE,
    module: AuditModule.HR,
    description: '{{userName}} revogou o dispositivo {{deviceName}}',
  } satisfies AuditMessage,

  /** Dispositivo de ponto excluído */
  PUNCH_DEVICE_DELETED: {
    action: AuditAction.DELETE,
    entity: AuditEntity.PUNCH_DEVICE,
    module: AuditModule.HR,
    description: '{{userName}} excluiu o dispositivo de ponto {{deviceName}}',
  } satisfies AuditMessage,

  /** Batida de ponto registrada (novo canal unificado — Plan 3) */
  PUNCH_REGISTERED: {
    action: AuditAction.CLOCK_IN,
    entity: AuditEntity.TIME_ENTRY,
    module: AuditModule.HR,
    description:
      '{{employeeName}} registrou ponto às {{time}} (NSR {{nsrNumber}})',
  } satisfies AuditMessage,

  /** Aprovação de ponto criada (ex.: fora de geofence — Plan 5) */
  PUNCH_APPROVAL_CREATED: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PUNCH_APPROVAL,
    module: AuditModule.HR,
    description:
      'Aprovação de ponto criada para {{employeeName}} (motivo: {{reason}})',
  } satisfies AuditMessage,

  /**
   * Aprovação de ponto resolvida (APPROVED ou REJECTED — Plan 5 / Phase 7).
   * Usa enum dedicado `PUNCH_APPROVAL_RESOLVED` (Phase 7 / Plan 07-01) ao invés
   * do genérico `UPDATE`: auditoria Portaria 671 passa a ter ação específica
   * para exceção resolvida, permitindo filtros e dashboards direcionados.
   */
  PUNCH_APPROVAL_RESOLVED: {
    action: AuditAction.PUNCH_APPROVAL_RESOLVED,
    entity: AuditEntity.PUNCH_APPROVAL,
    module: AuditModule.HR,
    description: '{{userName}} {{decision}} a exceção {{approvalId}}',
  } satisfies AuditMessage,

  // ============================================================================
  // Phase 7 / Plan 07-01 — Dashboard Gestor (audit templates PII-safe)
  // ============================================================================

  /**
   * Export em lote de batidas (CSV/PDF/AFD/AFDT) — disparado via modal ou
   * worker assíncrono (D-11). LGPD: NUNCA verbaliza employeeIds ou CPFs;
   * apenas formato, período e contagem de linhas.
   */
  PUNCH_BATCH_EXPORTED: {
    action: AuditAction.PUNCH_BATCH_EXPORTED,
    entity: AuditEntity.EXPORT_JOB,
    module: AuditModule.HR,
    description:
      '{{userName}} exportou batidas em lote (formato {{format}}, período {{period}}, {{count}} linhas)',
  } satisfies AuditMessage,

  /**
   * Job `detect-missed-punches` (22h) concluiu — contagem de faltantes
   * detectados no tenant (D-12). Não nomeia funcionários.
   */
  PUNCH_MISSED_PUNCH_DETECTED: {
    action: AuditAction.PUNCH_MISSED_PUNCH_DETECTED,
    entity: AuditEntity.PUNCH_MISSED_LOG,
    module: AuditModule.HR,
    description: 'Job detectou {{count}} funcionários faltantes em {{date}}',
  } satisfies AuditMessage,

  /**
   * Dispositivo de ponto transitou entre ONLINE ↔ OFFLINE (heartbeat
   * 60s / threshold 3min, D-13). `deviceId` é UUID opaco, não expõe
   * localização física.
   */
  PUNCH_DEVICE_STATUS_CHANGED: {
    action: AuditAction.PUNCH_DEVICE_STATUS_CHANGED,
    entity: AuditEntity.PUNCH_DEVICE,
    module: AuditModule.HR,
    description: 'Dispositivo {{deviceId}} transitou para {{status}}',
  } satisfies AuditMessage,

  // ============================================================================
  // Phase 10 / Plan 10-01 — PUNCH BIO AGENT (Agente Biométrico)
  // Audit messages para eventos do agente biométrico (leitor DigitalPersona /
  // Windows Hello). Usam PUNCH_BIO_AGENT entity + 4 novos AuditAction values.
  // LGPD: templates usam {{userName}}/{{employeeName}}/{{deviceLabel}} — nunca
  // CPF/email/cargo direto (T-10-01-04 mitigation).
  // ============================================================================

  /** Agente biométrico pareado com um dispositivo de ponto (Plan 10-02) */
  PUNCH_BIO_AGENT_PAIRED: {
    action: AuditAction.AGENT_PAIRED,
    entity: AuditEntity.PUNCH_BIO_AGENT,
    module: AuditModule.HR,
    description: '{{userName}} pareou agente biométrico {{deviceLabel}}',
  } satisfies AuditMessage,

  /** Biometria digital do funcionário cadastrada no agente (Plan 10-04) */
  PUNCH_BIO_ENROLLED: {
    action: AuditAction.BIO_ENROLLED,
    entity: AuditEntity.PUNCH_BIO_AGENT,
    module: AuditModule.HR,
    description:
      '{{adminUserName}} cadastrou biometria de {{employeeName}} no agente {{deviceLabel}}',
  } satisfies AuditMessage,

  /** Funcionário bateu ponto via biometria digital (Plan 10-03) */
  PUNCH_BIO_MATCH: {
    action: AuditAction.BIO_MATCH,
    entity: AuditEntity.PUNCH_BIO_AGENT,
    module: AuditModule.HR,
    description:
      'Funcionário {{employeeName}} bateu ponto via biometria no agente {{deviceLabel}}',
  } satisfies AuditMessage,

  /** Agente biométrico revogado (Plan 10-05 / Plan 10-02) */
  PUNCH_BIO_AGENT_REVOKED: {
    action: AuditAction.AGENT_REVOKED,
    entity: AuditEntity.PUNCH_BIO_AGENT,
    module: AuditModule.HR,
    description: '{{userName}} revogou agente biométrico {{deviceLabel}}',
  } satisfies AuditMessage,

  // ============================================================================
  // PUNCH QR TOKENS - Crachá rotacionável (Phase 5 — D-14)
  // ============================================================================

  /** QR do crachá rotacionado (individual ou via job de massa) */
  PUNCH_QR_TOKEN_ROTATED: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PUNCH_QR_TOKEN,
    module: AuditModule.HR,
    description: '{{userName}} rotacionou o QR do crachá de {{employeeName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // PUNCH FACE ENROLLMENT - Biometria facial (Phase 5 — D-02 / D-05 / D-07)
  // ============================================================================

  /** Biometria facial cadastrada por admin (3-5 fotos) */
  PUNCH_FACE_ENROLLMENT_CREATED: {
    action: AuditAction.CREATE,
    entity: AuditEntity.FACE_ENROLLMENT,
    module: AuditModule.HR,
    description:
      '{{userName}} cadastrou biometria facial de {{employeeName}} ({{photoCount}} fotos)',
  } satisfies AuditMessage,

  /** Biometria facial removida (soft-delete) */
  PUNCH_FACE_ENROLLMENT_REMOVED: {
    action: AuditAction.DELETE,
    entity: AuditEntity.FACE_ENROLLMENT,
    module: AuditModule.HR,
    description: '{{userName}} removeu a biometria facial de {{employeeName}}',
  } satisfies AuditMessage,

  /** Consentimento LGPD para captura de biometria (D-07) — hash do termo */
  PUNCH_FACE_ENROLLMENT_CONSENT_GIVEN: {
    action: AuditAction.CREATE,
    entity: AuditEntity.FACE_ENROLLMENT,
    module: AuditModule.HR,
    description:
      '{{userName}} registrou consentimento LGPD de biometria de {{employeeName}} (hash: {{consentTextHash}})',
  } satisfies AuditMessage,

  // ============================================================================
  // PUNCH PIN - Fallback PIN no kiosk (Phase 5 — D-08 / D-11)
  // ============================================================================

  /** PIN de ponto definido ou alterado pelo funcionário/admin */
  PUNCH_PIN_SET: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PUNCH_PIN,
    module: AuditModule.HR,
    description:
      '{{userName}} definiu/alterou o PIN de ponto de {{employeeName}}',
  } satisfies AuditMessage,

  /** PIN de ponto bloqueado após 5 tentativas inválidas (auto, sem userName) */
  PUNCH_PIN_LOCKED: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PUNCH_PIN,
    module: AuditModule.HR,
    description:
      'PIN de ponto de {{employeeName}} bloqueado após {{attempts}} tentativas',
  } satisfies AuditMessage,

  /** PIN de ponto desbloqueado manualmente por admin (gate hr.punch-devices.admin) */
  PUNCH_PIN_UNLOCKED: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PUNCH_PIN,
    module: AuditModule.HR,
    description:
      '{{userName}} desbloqueou manualmente o PIN de ponto de {{employeeName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // HR TENANT CONFIG - Configuração geral de RH
  // ============================================================================

  /** Configuração de RH atualizada */
  HR_CONFIG_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.HR_TENANT_CONFIG,
    module: AuditModule.HR,
    description: '{{userName}} atualizou a configuração de RH do tenant',
  } satisfies AuditMessage,

  /** Zona de geofence criada */
  GEOFENCE_ZONE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.GEOFENCE_ZONE,
    module: AuditModule.HR,
    description: '{{userName}} criou a zona de geofence {{zoneName}}',
  } satisfies AuditMessage,

  /** Zona de geofence atualizada */
  GEOFENCE_ZONE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.GEOFENCE_ZONE,
    module: AuditModule.HR,
    description: '{{userName}} atualizou a zona de geofence {{zoneName}}',
  } satisfies AuditMessage,

  /** Zona de geofence removida */
  GEOFENCE_ZONE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.GEOFENCE_ZONE,
    module: AuditModule.HR,
    description: '{{userName}} removeu a zona de geofence {{zoneName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // ABSENCES - Gestão de ausências
  // ============================================================================

  /** Solicitação de férias */
  VACATION_REQUEST: {
    action: AuditAction.ABSENCE_REQUEST,
    entity: AuditEntity.ABSENCE,
    module: AuditModule.HR,
    description:
      '{{employeeName}} solicitou férias de {{startDate}} a {{endDate}}',
  } satisfies AuditMessage,

  /** Registro de licença médica */
  SICK_LEAVE_REQUEST: {
    action: AuditAction.ABSENCE_REQUEST,
    entity: AuditEntity.ABSENCE,
    module: AuditModule.HR,
    description:
      '{{employeeName}} registrou licença médica de {{startDate}} a {{endDate}}',
  } satisfies AuditMessage,

  /** Ausência aprovada */
  ABSENCE_APPROVE: {
    action: AuditAction.ABSENCE_APPROVE,
    entity: AuditEntity.ABSENCE,
    module: AuditModule.HR,
    description: '{{userName}} aprovou a ausência de {{employeeName}}',
  } satisfies AuditMessage,

  /** Ausência rejeitada */
  ABSENCE_REJECT: {
    action: AuditAction.ABSENCE_REJECT,
    entity: AuditEntity.ABSENCE,
    module: AuditModule.HR,
    description:
      '{{userName}} rejeitou a ausência de {{employeeName}}: {{reason}}',
  } satisfies AuditMessage,

  /** Ausência cancelada */
  ABSENCE_CANCEL: {
    action: AuditAction.ABSENCE_CANCEL,
    entity: AuditEntity.ABSENCE,
    module: AuditModule.HR,
    description: '{{userName}} cancelou a ausência de {{employeeName}}',
  } satisfies AuditMessage,

  /** Ausência atualizada */
  ABSENCE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.ABSENCE,
    module: AuditModule.HR,
    description: '{{userName}} atualizou a ausência de {{employeeName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // VACATION PERIODS - Períodos aquisitivos de férias
  // ============================================================================

  /** Período de férias criado */
  VACATION_PERIOD_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.VACATION_PERIOD,
    module: AuditModule.HR,
    description:
      '{{userName}} criou período aquisitivo de férias para {{employeeName}}',
  } satisfies AuditMessage,

  /** Período de férias atualizado */
  VACATION_PERIOD_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.VACATION_PERIOD,
    module: AuditModule.HR,
    description: '{{userName}} atualizou período de férias de {{employeeName}}',
  } satisfies AuditMessage,

  /** Férias agendadas */
  VACATION_SCHEDULE: {
    action: AuditAction.VACATION_SCHEDULE,
    entity: AuditEntity.VACATION_PERIOD,
    module: AuditModule.HR,
    description:
      '{{userName}} agendou férias de {{employeeName}} para {{startDate}} a {{endDate}}',
  } satisfies AuditMessage,

  /** Férias iniciadas */
  VACATION_START: {
    action: AuditAction.VACATION_START,
    entity: AuditEntity.VACATION_PERIOD,
    module: AuditModule.HR,
    description: '{{employeeName}} iniciou período de férias',
  } satisfies AuditMessage,

  /** Férias concluídas */
  VACATION_COMPLETE: {
    action: AuditAction.VACATION_COMPLETE,
    entity: AuditEntity.VACATION_PERIOD,
    module: AuditModule.HR,
    description: '{{employeeName}} retornou das férias',
  } satisfies AuditMessage,

  /** Férias canceladas */
  VACATION_CANCEL: {
    action: AuditAction.VACATION_CANCEL,
    entity: AuditEntity.VACATION_PERIOD,
    module: AuditModule.HR,
    description:
      '{{userName}} cancelou as férias agendadas de {{employeeName}}',
  } satisfies AuditMessage,

  /** Dias de férias vendidos */
  VACATION_SELL_DAYS: {
    action: AuditAction.VACATION_SELL,
    entity: AuditEntity.VACATION_PERIOD,
    module: AuditModule.HR,
    description: '{{employeeName}} vendeu {{days}} dias de férias',
  } satisfies AuditMessage,

  // ============================================================================
  // OVERTIME - Horas extras
  // ============================================================================

  /** Solicitação de hora extra */
  OVERTIME_REQUEST: {
    action: AuditAction.OVERTIME_REQUEST,
    entity: AuditEntity.OVERTIME,
    module: AuditModule.HR,
    description:
      '{{employeeName}} solicitou {{hours}} horas extras para {{date}}',
  } satisfies AuditMessage,

  /** Hora extra aprovada */
  OVERTIME_APPROVE: {
    action: AuditAction.OVERTIME_APPROVE,
    entity: AuditEntity.OVERTIME,
    module: AuditModule.HR,
    description:
      '{{userName}} aprovou {{hours}} horas extras de {{employeeName}}',
  } satisfies AuditMessage,

  /** Hora extra rejeitada */
  OVERTIME_REJECT: {
    action: AuditAction.OVERTIME_REJECT,
    entity: AuditEntity.OVERTIME,
    module: AuditModule.HR,
    description:
      '{{userName}} rejeitou {{hours}} horas extras de {{employeeName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // TIME BANK - Banco de horas
  // ============================================================================

  /** Crédito no banco de horas */
  TIME_BANK_CREDIT: {
    action: AuditAction.TIME_BANK_CREDIT,
    entity: AuditEntity.TIME_BANK,
    module: AuditModule.HR,
    description:
      '{{userName}} creditou {{hours}} horas no banco de {{employeeName}}',
  } satisfies AuditMessage,

  /** Débito no banco de horas */
  TIME_BANK_DEBIT: {
    action: AuditAction.TIME_BANK_DEBIT,
    entity: AuditEntity.TIME_BANK,
    module: AuditModule.HR,
    description:
      '{{userName}} debitou {{hours}} horas do banco de {{employeeName}}',
  } satisfies AuditMessage,

  /** Ajuste no banco de horas */
  TIME_BANK_ADJUST: {
    action: AuditAction.TIME_BANK_ADJUST,
    entity: AuditEntity.TIME_BANK,
    module: AuditModule.HR,
    description:
      '{{userName}} ajustou o banco de horas de {{employeeName}}: {{adjustment}}',
  } satisfies AuditMessage,

  // ============================================================================
  // PAYROLLS - Folhas de pagamento
  // ============================================================================

  /** Folha de pagamento criada */
  PAYROLL_CREATE: {
    action: AuditAction.PAYROLL_CREATE,
    entity: AuditEntity.PAYROLL,
    module: AuditModule.HR,
    description:
      '{{userName}} criou a folha de pagamento de {{month}}/{{year}}',
  } satisfies AuditMessage,

  /** Folha de pagamento calculada */
  PAYROLL_CALCULATE: {
    action: AuditAction.PAYROLL_CALCULATE,
    entity: AuditEntity.PAYROLL,
    module: AuditModule.HR,
    description:
      '{{userName}} calculou a folha de pagamento de {{month}}/{{year}}',
  } satisfies AuditMessage,

  /** Folha de pagamento aprovada */
  PAYROLL_APPROVE: {
    action: AuditAction.PAYROLL_APPROVE,
    entity: AuditEntity.PAYROLL,
    module: AuditModule.HR,
    description:
      '{{userName}} aprovou a folha de pagamento de {{month}}/{{year}}',
  } satisfies AuditMessage,

  /** Folha de pagamento paga */
  PAYROLL_PAY: {
    action: AuditAction.PAYROLL_PAY,
    entity: AuditEntity.PAYROLL,
    module: AuditModule.HR,
    description:
      '{{userName}} registrou pagamento da folha de {{month}}/{{year}}',
  } satisfies AuditMessage,

  /** Folha de pagamento cancelada */
  PAYROLL_CANCEL: {
    action: AuditAction.PAYROLL_CANCEL,
    entity: AuditEntity.PAYROLL,
    module: AuditModule.HR,
    description:
      '{{userName}} cancelou a folha de pagamento de {{month}}/{{year}}',
  } satisfies AuditMessage,

  // ============================================================================
  // BONUSES - Bônus
  // ============================================================================

  /** Bônus criado */
  BONUS_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.BONUS,
    module: AuditModule.HR,
    description:
      '{{userName}} concedeu bônus de R$ {{amount}} para {{employeeName}}: {{description}}',
  } satisfies AuditMessage,

  /** Bônus atualizado */
  BONUS_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.BONUS,
    module: AuditModule.HR,
    description:
      '{{userName}} atualizou bônus de {{employeeName}}: {{description}}',
  } satisfies AuditMessage,

  /** Bônus excluído */
  BONUS_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.BONUS,
    module: AuditModule.HR,
    description: '{{userName}} removeu bônus de {{employeeName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // DEDUCTIONS - Descontos
  // ============================================================================

  /** Desconto criado */
  DEDUCTION_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.DEDUCTION,
    module: AuditModule.HR,
    description:
      '{{userName}} registrou desconto de R$ {{amount}} para {{employeeName}}: {{description}}',
  } satisfies AuditMessage,

  /** Desconto atualizado */
  DEDUCTION_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.DEDUCTION,
    module: AuditModule.HR,
    description:
      '{{userName}} atualizou desconto de {{employeeName}}: {{description}}',
  } satisfies AuditMessage,

  /** Desconto excluído */
  DEDUCTION_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.DEDUCTION,
    module: AuditModule.HR,
    description: '{{userName}} removeu desconto de {{employeeName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // TERMINATIONS - Rescisões
  // ============================================================================

  /** Rescisão criada */
  TERMINATION_CREATE: {
    action: AuditAction.TERMINATION_CREATE,
    entity: AuditEntity.TERMINATION,
    module: AuditModule.HR,
    description:
      '{{userName}} registrou rescisão de {{employeeName}} ({{terminationType}})',
  } satisfies AuditMessage,

  /** Verbas rescisórias calculadas */
  TERMINATION_CALCULATE: {
    action: AuditAction.TERMINATION_CALCULATE,
    entity: AuditEntity.TERMINATION,
    module: AuditModule.HR,
    description:
      '{{userName}} calculou verbas rescisórias de {{employeeName}} — Total líquido: R$ {{totalLiquido}}',
  } satisfies AuditMessage,

  /** Rescisão paga */
  TERMINATION_PAY: {
    action: AuditAction.TERMINATION_PAY,
    entity: AuditEntity.TERMINATION,
    module: AuditModule.HR,
    description:
      '{{userName}} registrou pagamento da rescisão de {{employeeName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // WORK SCHEDULES - Escalas de trabalho
  // ============================================================================

  /** Escala de trabalho criada */
  WORK_SCHEDULE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.WORK_SCHEDULE,
    module: AuditModule.HR,
    description: '{{userName}} criou a escala de trabalho {{scheduleName}}',
  } satisfies AuditMessage,

  /** Escala de trabalho atualizada */
  WORK_SCHEDULE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.WORK_SCHEDULE,
    module: AuditModule.HR,
    description: '{{userName}} atualizou a escala de trabalho {{scheduleName}}',
  } satisfies AuditMessage,

  /** Escala de trabalho excluída */
  WORK_SCHEDULE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.WORK_SCHEDULE,
    module: AuditModule.HR,
    description: '{{userName}} excluiu a escala de trabalho {{scheduleName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // SHIFTS - Turnos
  // ============================================================================

  /** Turno criado */
  SHIFT_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.SHIFT,
    module: AuditModule.HR,
    description: '{{userName}} criou o turno {{shiftName}}',
  } satisfies AuditMessage,

  /** Turno atualizado */
  SHIFT_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.SHIFT,
    module: AuditModule.HR,
    description: '{{userName}} atualizou o turno {{shiftName}}',
  } satisfies AuditMessage,

  /** Turno excluído */
  SHIFT_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.SHIFT,
    module: AuditModule.HR,
    description: '{{userName}} excluiu o turno {{shiftName}}',
  } satisfies AuditMessage,

  /** Funcionário atribuído a turno */
  SHIFT_ASSIGNMENT_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.SHIFT_ASSIGNMENT,
    module: AuditModule.HR,
    description:
      '{{userName}} atribuiu o funcionário {{employeeId}} ao turno {{shiftName}}',
  } satisfies AuditMessage,

  /** Funcionário removido de turno */
  SHIFT_ASSIGNMENT_REMOVE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.SHIFT_ASSIGNMENT,
    module: AuditModule.HR,
    description:
      '{{userName}} removeu a atribuição do funcionário {{employeeId}} do turno',
  } satisfies AuditMessage,

  /** Funcionário transferido de turno */
  SHIFT_ASSIGNMENT_TRANSFER: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.SHIFT_ASSIGNMENT,
    module: AuditModule.HR,
    description:
      '{{userName}} transferiu o funcionário {{employeeId}} para o turno {{shiftName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // COMPANIES - Empresas
  // ============================================================================

  /** Empresa criada */
  COMPANY_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.COMPANY,
    module: AuditModule.HR,
    description:
      '{{userName}} cadastrou a empresa {{companyName}} (CNPJ: {{cnpj}})',
  } satisfies AuditMessage,

  /** Empresa atualizada */
  COMPANY_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.COMPANY,
    module: AuditModule.HR,
    description: '{{userName}} atualizou os dados da empresa {{companyName}}',
  } satisfies AuditMessage,

  /** Empresa excluída */
  COMPANY_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.COMPANY,
    module: AuditModule.HR,
    description: '{{userName}} excluiu a empresa {{companyName}}',
  } satisfies AuditMessage,

  /** Verificação de CNPJ */
  COMPANY_CHECK_CNPJ: {
    action: AuditAction.CHECK_CNPJ,
    entity: AuditEntity.COMPANY,
    module: AuditModule.HR,
    description: '{{userName}} verificou o CNPJ {{cnpj}}',
  } satisfies AuditMessage,

  // ============================================================================
  // COMPANY ADDRESSES - Endereços de empresas
  // ============================================================================

  /** Endereço de empresa criado */
  COMPANY_ADDRESS_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.COMPANY_ADDRESS,
    module: AuditModule.HR,
    description: '{{userName}} adicionou endereço para {{companyName}}',
  } satisfies AuditMessage,

  /** Endereço de empresa atualizado */
  COMPANY_ADDRESS_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.COMPANY_ADDRESS,
    module: AuditModule.HR,
    description: '{{userName}} atualizou endereço de {{companyName}}',
  } satisfies AuditMessage,

  /** Endereço de empresa excluído */
  COMPANY_ADDRESS_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.COMPANY_ADDRESS,
    module: AuditModule.HR,
    description: '{{userName}} removeu endereço de {{companyName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // COMPANY CNAEs - Atividades econômicas
  // ============================================================================

  /** CNAE adicionado à empresa */
  COMPANY_CNAE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.COMPANY_CNAE,
    module: AuditModule.HR,
    description:
      '{{userName}} adicionou CNAE {{cnaeCode}} para {{companyName}}',
  } satisfies AuditMessage,

  /** CNAE atualizado */
  COMPANY_CNAE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.COMPANY_CNAE,
    module: AuditModule.HR,
    description: '{{userName}} atualizou CNAE de {{companyName}}',
  } satisfies AuditMessage,

  /** CNAE removido da empresa */
  COMPANY_CNAE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.COMPANY_CNAE,
    module: AuditModule.HR,
    description: '{{userName}} removeu CNAE {{cnaeCode}} de {{companyName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // COMPANY FISCAL SETTINGS - Configurações fiscais
  // ============================================================================

  /** Configurações fiscais criadas */
  COMPANY_FISCAL_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.COMPANY_FISCAL_SETTINGS,
    module: AuditModule.HR,
    description: '{{userName}} configurou dados fiscais de {{companyName}}',
  } satisfies AuditMessage,

  /** Configurações fiscais atualizadas */
  COMPANY_FISCAL_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.COMPANY_FISCAL_SETTINGS,
    module: AuditModule.HR,
    description: '{{userName}} atualizou dados fiscais de {{companyName}}',
  } satisfies AuditMessage,

  /** Configurações fiscais excluídas */
  COMPANY_FISCAL_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.COMPANY_FISCAL_SETTINGS,
    module: AuditModule.HR,
    description: '{{userName}} removeu dados fiscais de {{companyName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // COMPANY STAKEHOLDERS - Sócios/Stakeholders
  // ============================================================================

  /** Stakeholder adicionado */
  COMPANY_STAKEHOLDER_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.COMPANY_STAKEHOLDER,
    module: AuditModule.HR,
    description:
      '{{userName}} adicionou {{stakeholderName}} como sócio de {{companyName}}',
  } satisfies AuditMessage,

  /** Stakeholder atualizado */
  COMPANY_STAKEHOLDER_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.COMPANY_STAKEHOLDER,
    module: AuditModule.HR,
    description:
      '{{userName}} atualizou dados de {{stakeholderName}} em {{companyName}}',
  } satisfies AuditMessage,

  /** Stakeholder removido */
  COMPANY_STAKEHOLDER_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.COMPANY_STAKEHOLDER,
    module: AuditModule.HR,
    description: '{{userName}} removeu {{stakeholderName}} de {{companyName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // BENEFIT PLANS - Planos de Benefícios
  // ============================================================================

  /** Plano de benefício criado */
  BENEFIT_PLAN_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.BENEFIT_PLAN,
    module: AuditModule.HR,
    description: '{{userName}} criou o plano de benefício {{planName}}',
  } satisfies AuditMessage,

  /** Plano de benefício atualizado */
  BENEFIT_PLAN_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.BENEFIT_PLAN,
    module: AuditModule.HR,
    description: '{{userName}} atualizou o plano de benefício {{planName}}',
  } satisfies AuditMessage,

  /** Plano de benefício desativado */
  BENEFIT_PLAN_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.BENEFIT_PLAN,
    module: AuditModule.HR,
    description: '{{userName}} desativou o plano de benefício {{planName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // BENEFIT ENROLLMENTS - Inscrições em Benefícios
  // ============================================================================

  /** Funcionário inscrito em benefício */
  BENEFIT_ENROLLMENT_CREATE: {
    action: AuditAction.BENEFIT_ENROLL,
    entity: AuditEntity.BENEFIT_ENROLLMENT,
    module: AuditModule.HR,
    description:
      '{{userName}} inscreveu {{employeeName}} no plano {{planName}}',
  } satisfies AuditMessage,

  /** Inscrição em benefício atualizada */
  BENEFIT_ENROLLMENT_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.BENEFIT_ENROLLMENT,
    module: AuditModule.HR,
    description:
      '{{userName}} atualizou inscrição de {{employeeName}} no plano {{planName}}',
  } satisfies AuditMessage,

  /** Inscrição em benefício cancelada */
  BENEFIT_ENROLLMENT_CANCEL: {
    action: AuditAction.BENEFIT_CANCEL,
    entity: AuditEntity.BENEFIT_ENROLLMENT,
    module: AuditModule.HR,
    description:
      '{{userName}} cancelou inscrição de {{employeeName}} no benefício',
  } satisfies AuditMessage,

  /** Inscrição em massa em benefício */
  BENEFIT_ENROLLMENT_BULK: {
    action: AuditAction.BENEFIT_BULK_ENROLL,
    entity: AuditEntity.BENEFIT_ENROLLMENT,
    module: AuditModule.HR,
    description:
      '{{userName}} inscreveu {{count}} funcionários no plano {{planName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // FLEX BENEFITS - Benefícios Flexíveis
  // ============================================================================

  /** Alocação de benefício flexível */
  FLEX_BENEFIT_ALLOCATE: {
    action: AuditAction.FLEX_BENEFIT_ALLOCATE,
    entity: AuditEntity.FLEX_BENEFIT_ALLOCATION,
    module: AuditModule.HR,
    description:
      '{{userName}} alocou benefícios flexíveis para {{employeeName}} em {{month}}/{{year}}',
  } satisfies AuditMessage,

  /** Cálculo de deduções de benefícios */
  BENEFIT_DEDUCTION_CALCULATE: {
    action: AuditAction.BENEFIT_DEDUCTION_CALCULATE,
    entity: AuditEntity.BENEFIT_ENROLLMENT,
    module: AuditModule.HR,
    description:
      '{{userName}} calculou deduções de benefícios de {{employeeName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // PORTAL DO COLABORADOR - Solicitações
  // ============================================================================

  /** Solicitação criada */
  EMPLOYEE_REQUEST_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.EMPLOYEE_REQUEST,
    module: AuditModule.HR,
    description: '{{userName}} criou uma solicitação de {{requestType}}',
  } satisfies AuditMessage,

  /** Solicitação cancelada */
  EMPLOYEE_REQUEST_CANCEL: {
    action: AuditAction.CANCEL,
    entity: AuditEntity.EMPLOYEE_REQUEST,
    module: AuditModule.HR,
    description: '{{userName}} cancelou a solicitação',
  } satisfies AuditMessage,

  /** Solicitação aprovada */
  EMPLOYEE_REQUEST_APPROVE: {
    action: AuditAction.REQUEST_APPROVE,
    entity: AuditEntity.EMPLOYEE_REQUEST,
    module: AuditModule.HR,
    description: '{{userName}} aprovou a solicitação de {{employeeName}}',
  } satisfies AuditMessage,

  /** Solicitação rejeitada */
  EMPLOYEE_REQUEST_REJECT: {
    action: AuditAction.REQUEST_REJECT,
    entity: AuditEntity.EMPLOYEE_REQUEST,
    module: AuditModule.HR,
    description: '{{userName}} rejeitou a solicitação de {{employeeName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // PORTAL DO COLABORADOR - Comunicados
  // ============================================================================

  /** Comunicado criado */
  ANNOUNCEMENT_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.COMPANY_ANNOUNCEMENT,
    module: AuditModule.HR,
    description: '{{userName}} criou o comunicado "{{announcementTitle}}"',
  } satisfies AuditMessage,

  /** Comunicado atualizado */
  ANNOUNCEMENT_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.COMPANY_ANNOUNCEMENT,
    module: AuditModule.HR,
    description: '{{userName}} atualizou o comunicado "{{announcementTitle}}"',
  } satisfies AuditMessage,

  /** Comunicado removido */
  ANNOUNCEMENT_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.COMPANY_ANNOUNCEMENT,
    module: AuditModule.HR,
    description: '{{userName}} removeu o comunicado "{{announcementTitle}}"',
  } satisfies AuditMessage,

  // ============================================================================
  // PORTAL DO COLABORADOR - Kudos
  // ============================================================================

  /** Kudos enviado */
  KUDOS_SEND: {
    action: AuditAction.KUDOS_SEND,
    entity: AuditEntity.EMPLOYEE_KUDOS,
    module: AuditModule.HR,
    description:
      '{{userName}} enviou um kudos de {{category}} para {{recipientName}}',
  } satisfies AuditMessage,

  /** Reação adicionada a um kudos */
  KUDOS_REACT: {
    action: AuditAction.KUDOS_REACT,
    entity: AuditEntity.EMPLOYEE_KUDOS,
    module: AuditModule.HR,
    description: '{{userName}} reagiu com {{emoji}} ao kudos',
  } satisfies AuditMessage,

  /** Reação removida de um kudos */
  KUDOS_UNREACT: {
    action: AuditAction.KUDOS_UNREACT,
    entity: AuditEntity.EMPLOYEE_KUDOS,
    module: AuditModule.HR,
    description: '{{userName}} removeu a reação {{emoji}} do kudos',
  } satisfies AuditMessage,

  /** Resposta criada em um kudos */
  KUDOS_REPLY_CREATE: {
    action: AuditAction.KUDOS_REPLY_CREATE,
    entity: AuditEntity.EMPLOYEE_KUDOS,
    module: AuditModule.HR,
    description: '{{userName}} respondeu ao kudos',
  } satisfies AuditMessage,

  /** Resposta editada em um kudos */
  KUDOS_REPLY_UPDATE: {
    action: AuditAction.KUDOS_REPLY_UPDATE,
    entity: AuditEntity.EMPLOYEE_KUDOS,
    module: AuditModule.HR,
    description: '{{userName}} editou uma resposta do kudos',
  } satisfies AuditMessage,

  /** Resposta removida de um kudos */
  KUDOS_REPLY_DELETE: {
    action: AuditAction.KUDOS_REPLY_DELETE,
    entity: AuditEntity.EMPLOYEE_KUDOS,
    module: AuditModule.HR,
    description: '{{userName}} removeu uma resposta do kudos',
  } satisfies AuditMessage,

  /** Kudos fixado no topo do feed */
  KUDOS_PIN: {
    action: AuditAction.KUDOS_PIN,
    entity: AuditEntity.EMPLOYEE_KUDOS,
    module: AuditModule.HR,
    description: '{{userName}} fixou um kudos no topo do feed',
  } satisfies AuditMessage,

  /** Kudos desafixado do topo do feed */
  KUDOS_UNPIN: {
    action: AuditAction.KUDOS_UNPIN,
    entity: AuditEntity.EMPLOYEE_KUDOS,
    module: AuditModule.HR,
    description: '{{userName}} desafixou um kudos do topo do feed',
  } satisfies AuditMessage,

  // ============================================================================
  // PORTAL DO COLABORADOR - Onboarding
  // ============================================================================

  /** Item de onboarding concluído */
  ONBOARDING_ITEM_COMPLETE: {
    action: AuditAction.ONBOARDING_COMPLETE_ITEM,
    entity: AuditEntity.ONBOARDING_CHECKLIST,
    module: AuditModule.HR,
    description: '{{userName}} concluiu o item "{{itemTitle}}" do onboarding',
  } satisfies AuditMessage,

  /** Checklist de onboarding criado */
  ONBOARDING_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.ONBOARDING_CHECKLIST,
    module: AuditModule.HR,
    description:
      '{{userName}} criou checklist de onboarding para {{employeeName}}',
  } satisfies AuditMessage,

  /** Checklist de onboarding atualizado */
  ONBOARDING_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.ONBOARDING_CHECKLIST,
    module: AuditModule.HR,
    description:
      '{{userName}} atualizou o checklist de onboarding de {{employeeName}}',
  } satisfies AuditMessage,

  /** Checklist de onboarding excluído */
  ONBOARDING_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.ONBOARDING_CHECKLIST,
    module: AuditModule.HR,
    description:
      '{{userName}} excluiu o checklist de onboarding de {{employeeName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // OFFBOARDING - Checklists de desligamento
  // ============================================================================

  /** Item de offboarding concluído */
  OFFBOARDING_ITEM_COMPLETE: {
    action: AuditAction.ONBOARDING_COMPLETE_ITEM,
    entity: AuditEntity.OFFBOARDING_CHECKLIST,
    module: AuditModule.HR,
    description: '{{userName}} concluiu o item "{{itemTitle}}" do offboarding',
  } satisfies AuditMessage,

  /** Checklist de offboarding criado */
  OFFBOARDING_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.OFFBOARDING_CHECKLIST,
    module: AuditModule.HR,
    description:
      '{{userName}} criou checklist de offboarding para {{employeeName}}',
  } satisfies AuditMessage,

  /** Checklist de offboarding atualizado */
  OFFBOARDING_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.OFFBOARDING_CHECKLIST,
    module: AuditModule.HR,
    description:
      '{{userName}} atualizou o checklist de offboarding de {{employeeName}}',
  } satisfies AuditMessage,

  /** Checklist de offboarding excluído */
  OFFBOARDING_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.OFFBOARDING_CHECKLIST,
    module: AuditModule.HR,
    description:
      '{{userName}} excluiu o checklist de offboarding de {{employeeName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // ADMISSÃO DIGITAL - Convites e assinaturas
  // ============================================================================

  /** Convite de admissão criado */
  ADMISSION_INVITE_CREATE: {
    action: AuditAction.ADMISSION_CREATE,
    entity: AuditEntity.ADMISSION_INVITE,
    module: AuditModule.HR,
    description:
      '{{userName}} criou convite de admissão para {{candidateName}}',
  } satisfies AuditMessage,

  /** Convite de admissão atualizado */
  ADMISSION_INVITE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.ADMISSION_INVITE,
    module: AuditModule.HR,
    description:
      '{{userName}} atualizou convite de admissão de {{candidateName}}',
  } satisfies AuditMessage,

  /** Convite de admissão cancelado */
  ADMISSION_INVITE_CANCEL: {
    action: AuditAction.ADMISSION_CANCEL,
    entity: AuditEntity.ADMISSION_INVITE,
    module: AuditModule.HR,
    description:
      '{{userName}} cancelou convite de admissão de {{candidateName}}',
  } satisfies AuditMessage,

  /** Admissão aprovada — funcionário criado */
  ADMISSION_APPROVE: {
    action: AuditAction.ADMISSION_APPROVE,
    entity: AuditEntity.ADMISSION_INVITE,
    module: AuditModule.HR,
    description:
      '{{userName}} aprovou a admissão de {{candidateName}} (matrícula {{registrationNumber}})',
  } satisfies AuditMessage,

  /** Admissão rejeitada */
  ADMISSION_REJECT: {
    action: AuditAction.ADMISSION_REJECT,
    entity: AuditEntity.ADMISSION_INVITE,
    module: AuditModule.HR,
    description: '{{userName}} rejeitou a admissão de {{candidateName}}',
  } satisfies AuditMessage,

  /** Documento assinado digitalmente */
  ADMISSION_SIGN: {
    action: AuditAction.ADMISSION_SIGN,
    entity: AuditEntity.DIGITAL_SIGNATURE,
    module: AuditModule.HR,
    description:
      '{{signerName}} assinou digitalmente o documento ({{signatureType}})',
  } satisfies AuditMessage,

  // ============================================================================
  // WARNINGS - Advertências Disciplinares
  // ============================================================================

  /** Advertência criada */
  WARNING_CREATE: {
    action: AuditAction.WARNING_CREATE,
    entity: AuditEntity.EMPLOYEE_WARNING,
    module: AuditModule.HR,
    description:
      '{{userName}} registrou advertência ({{warningType}}) para {{employeeName}}',
  } satisfies AuditMessage,

  /** Advertência atualizada */
  WARNING_UPDATE: {
    action: AuditAction.WARNING_UPDATE,
    entity: AuditEntity.EMPLOYEE_WARNING,
    module: AuditModule.HR,
    description: '{{userName}} atualizou advertência de {{employeeName}}',
  } satisfies AuditMessage,

  /** Advertência excluída */
  WARNING_DELETE: {
    action: AuditAction.WARNING_DELETE,
    entity: AuditEntity.EMPLOYEE_WARNING,
    module: AuditModule.HR,
    description: '{{userName}} excluiu advertência de {{employeeName}}',
  } satisfies AuditMessage,

  /** Advertência revogada */
  WARNING_REVOKE: {
    action: AuditAction.WARNING_REVOKE,
    entity: AuditEntity.EMPLOYEE_WARNING,
    module: AuditModule.HR,
    description: '{{userName}} revogou advertência de {{employeeName}}',
  } satisfies AuditMessage,

  /** Advertência reconhecida pelo funcionário */
  WARNING_ACKNOWLEDGE: {
    action: AuditAction.WARNING_ACKNOWLEDGE,
    entity: AuditEntity.EMPLOYEE_WARNING,
    module: AuditModule.HR,
    description: '{{userName}} reconheceu advertência',
  } satisfies AuditMessage,

  // ============================================================================
  // TRAINING PROGRAMS - Programas de Treinamento
  // ============================================================================

  /** Programa de treinamento criado */
  TRAINING_PROGRAM_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.TRAINING_PROGRAM,
    module: AuditModule.HR,
    description: '{{userName}} criou o programa de treinamento {{programName}}',
  } satisfies AuditMessage,

  /** Programa de treinamento atualizado */
  TRAINING_PROGRAM_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.TRAINING_PROGRAM,
    module: AuditModule.HR,
    description:
      '{{userName}} atualizou o programa de treinamento {{programName}}',
  } satisfies AuditMessage,

  /** Programa de treinamento excluído */
  TRAINING_PROGRAM_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.TRAINING_PROGRAM,
    module: AuditModule.HR,
    description:
      '{{userName}} desativou o programa de treinamento {{programName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // TRAINING ENROLLMENTS - Inscrições em Treinamentos
  // ============================================================================

  /** Funcionário inscrito em treinamento */
  TRAINING_ENROLLMENT_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.TRAINING_ENROLLMENT,
    module: AuditModule.HR,
    description:
      '{{userName}} inscreveu funcionário no treinamento {{programName}}',
  } satisfies AuditMessage,

  /** Treinamento concluído */
  TRAINING_ENROLLMENT_COMPLETE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.TRAINING_ENROLLMENT,
    module: AuditModule.HR,
    description: '{{userName}} registrou conclusão de treinamento',
  } satisfies AuditMessage,

  /** Inscrição em treinamento cancelada */
  TRAINING_ENROLLMENT_CANCEL: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.TRAINING_ENROLLMENT,
    module: AuditModule.HR,
    description: '{{userName}} cancelou inscrição em treinamento',
  } satisfies AuditMessage,

  // ============================================================================
  // REVIEW CYCLES - Ciclos de Avaliação
  // ============================================================================

  /** Ciclo de avaliação criado */
  REVIEW_CYCLE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.REVIEW_CYCLE,
    module: AuditModule.HR,
    description: '{{userName}} criou o ciclo de avaliação {{cycleName}}',
  } satisfies AuditMessage,

  /** Ciclo de avaliação atualizado */
  REVIEW_CYCLE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.REVIEW_CYCLE,
    module: AuditModule.HR,
    description: '{{userName}} atualizou o ciclo de avaliação {{cycleName}}',
  } satisfies AuditMessage,

  /** Ciclo de avaliação excluído */
  REVIEW_CYCLE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.REVIEW_CYCLE,
    module: AuditModule.HR,
    description: '{{userName}} desativou o ciclo de avaliação {{cycleName}}',
  } satisfies AuditMessage,

  /** Ciclo de avaliação aberto */
  REVIEW_CYCLE_OPEN: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.REVIEW_CYCLE,
    module: AuditModule.HR,
    description: '{{userName}} abriu o ciclo de avaliação {{cycleName}}',
  } satisfies AuditMessage,

  /** Ciclo de avaliação fechado */
  REVIEW_CYCLE_CLOSE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.REVIEW_CYCLE,
    module: AuditModule.HR,
    description: '{{userName}} fechou o ciclo de avaliação {{cycleName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // PERFORMANCE REVIEWS - Avaliações de Desempenho
  // ============================================================================

  /** Avaliações de desempenho criadas em lote */
  PERFORMANCE_REVIEW_BULK_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PERFORMANCE_REVIEW,
    module: AuditModule.HR,
    description:
      '{{userName}} criou {{count}} avaliações para o ciclo {{cycleName}}',
  } satisfies AuditMessage,

  /** Autoavaliação submetida */
  PERFORMANCE_REVIEW_SELF_ASSESSMENT: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PERFORMANCE_REVIEW,
    module: AuditModule.HR,
    description: '{{userName}} submeteu autoavaliação de desempenho',
  } satisfies AuditMessage,

  /** Avaliação do gestor submetida */
  PERFORMANCE_REVIEW_MANAGER_REVIEW: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PERFORMANCE_REVIEW,
    module: AuditModule.HR,
    description: '{{userName}} submeteu avaliação de gestor para funcionário',
  } satisfies AuditMessage,

  /** Avaliação reconhecida pelo funcionário */
  PERFORMANCE_REVIEW_ACKNOWLEDGE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PERFORMANCE_REVIEW,
    module: AuditModule.HR,
    description: '{{userName}} reconheceu a avaliação de desempenho',
  } satisfies AuditMessage,

  /** Status da avaliação avançado sem alteração de notas ou comentários */
  PERFORMANCE_REVIEW_ADVANCE_STATUS: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PERFORMANCE_REVIEW,
    module: AuditModule.HR,
    description:
      '{{userName}} avançou o status da avaliação para {{nextStatus}}',
  } satisfies AuditMessage,

  // ============================================================================
  // REVIEW COMPETENCIES - Competências em Avaliações de Desempenho
  // ============================================================================

  /** Competência adicionada à avaliação */
  REVIEW_COMPETENCY_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.REVIEW_COMPETENCY,
    module: AuditModule.HR,
    description:
      '{{userName}} adicionou a competência {{competencyName}} à avaliação',
  } satisfies AuditMessage,

  /** Competência atualizada na avaliação */
  REVIEW_COMPETENCY_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.REVIEW_COMPETENCY,
    module: AuditModule.HR,
    description:
      '{{userName}} atualizou a competência {{competencyName}} da avaliação',
  } satisfies AuditMessage,

  /** Competência removida da avaliação */
  REVIEW_COMPETENCY_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.REVIEW_COMPETENCY,
    module: AuditModule.HR,
    description:
      '{{userName}} removeu uma competência da avaliação de desempenho',
  } satisfies AuditMessage,

  /** Competências padrão semeadas na avaliação */
  REVIEW_COMPETENCY_SEED_DEFAULTS: {
    action: AuditAction.CREATE,
    entity: AuditEntity.REVIEW_COMPETENCY,
    module: AuditModule.HR,
    description:
      '{{userName}} adicionou {{createdCount}} competências padrão à avaliação',
  } satisfies AuditMessage,

  // ============================================================================
  // DELEGAÇÃO DE APROVAÇÃO
  // ============================================================================

  /** Delegação de aprovação criada */
  DELEGATION_CREATE: {
    action: AuditAction.DELEGATION_CREATE,
    entity: AuditEntity.APPROVAL_DELEGATION,
    module: AuditModule.HR,
    description:
      '{{userName}} delegou autoridade de aprovação ({{scope}}) para {{delegateName}}',
  } satisfies AuditMessage,

  /** Delegação de aprovação revogada */
  DELEGATION_REVOKE: {
    action: AuditAction.DELEGATION_REVOKE,
    entity: AuditEntity.APPROVAL_DELEGATION,
    module: AuditModule.HR,
    description:
      '{{userName}} revogou delegação de aprovação para {{delegateName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // RECRUITMENT / ATS - Recrutamento e Seleção
  // ============================================================================

  /** Vaga criada */
  JOB_POSTING_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.JOB_POSTING,
    module: AuditModule.HR,
    description: '{{userName}} criou a vaga {{jobTitle}}',
  } satisfies AuditMessage,

  /** Vaga atualizada */
  JOB_POSTING_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.JOB_POSTING,
    module: AuditModule.HR,
    description: '{{userName}} atualizou a vaga {{jobTitle}}',
  } satisfies AuditMessage,

  /** Vaga excluída */
  JOB_POSTING_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.JOB_POSTING,
    module: AuditModule.HR,
    description: '{{userName}} excluiu a vaga {{jobTitle}}',
  } satisfies AuditMessage,

  /** Vaga publicada */
  JOB_POSTING_PUBLISH: {
    action: AuditAction.JOB_PUBLISH,
    entity: AuditEntity.JOB_POSTING,
    module: AuditModule.HR,
    description: '{{userName}} publicou a vaga {{jobTitle}}',
  } satisfies AuditMessage,

  /** Vaga encerrada */
  JOB_POSTING_CLOSE: {
    action: AuditAction.JOB_CLOSE,
    entity: AuditEntity.JOB_POSTING,
    module: AuditModule.HR,
    description: '{{userName}} encerrou a vaga {{jobTitle}}',
  } satisfies AuditMessage,

  /** Candidato criado */
  CANDIDATE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.CANDIDATE,
    module: AuditModule.HR,
    description: '{{userName}} cadastrou o candidato {{candidateName}}',
  } satisfies AuditMessage,

  /** Candidato atualizado */
  CANDIDATE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.CANDIDATE,
    module: AuditModule.HR,
    description: '{{userName}} atualizou o candidato {{candidateName}}',
  } satisfies AuditMessage,

  /** Candidato excluído */
  CANDIDATE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.CANDIDATE,
    module: AuditModule.HR,
    description: '{{userName}} excluiu o candidato {{candidateName}}',
  } satisfies AuditMessage,

  /** Candidatura criada */
  APPLICATION_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.APPLICATION,
    module: AuditModule.HR,
    description: '{{userName}} registrou candidatura para a vaga {{jobTitle}}',
  } satisfies AuditMessage,

  /** Status da candidatura atualizado */
  APPLICATION_STATUS_UPDATE: {
    action: AuditAction.STATUS_CHANGE,
    entity: AuditEntity.APPLICATION,
    module: AuditModule.HR,
    description:
      '{{userName}} alterou o status da candidatura para {{newStatus}}',
  } satisfies AuditMessage,

  /** Candidato contratado */
  APPLICATION_HIRE: {
    action: AuditAction.CANDIDATE_HIRE,
    entity: AuditEntity.APPLICATION,
    module: AuditModule.HR,
    description: '{{userName}} contratou o candidato {{candidateName}}',
  } satisfies AuditMessage,

  /** Candidatura rejeitada */
  APPLICATION_REJECT: {
    action: AuditAction.CANDIDATE_REJECT,
    entity: AuditEntity.APPLICATION,
    module: AuditModule.HR,
    description: '{{userName}} rejeitou a candidatura de {{candidateName}}',
  } satisfies AuditMessage,

  /** Entrevista agendada */
  INTERVIEW_SCHEDULE: {
    action: AuditAction.INTERVIEW_SCHEDULE,
    entity: AuditEntity.INTERVIEW,
    module: AuditModule.HR,
    description: '{{userName}} agendou entrevista para {{scheduledAt}}',
  } satisfies AuditMessage,

  /** Entrevista concluída */
  INTERVIEW_COMPLETE: {
    action: AuditAction.INTERVIEW_COMPLETE,
    entity: AuditEntity.INTERVIEW,
    module: AuditModule.HR,
    description:
      '{{userName}} concluiu entrevista com recomendação: {{recommendation}}',
  } satisfies AuditMessage,

  /** Entrevista cancelada */
  INTERVIEW_CANCEL: {
    action: AuditAction.INTERVIEW_CANCEL,
    entity: AuditEntity.INTERVIEW,
    module: AuditModule.HR,
    description: '{{userName}} cancelou a entrevista',
  } satisfies AuditMessage,

  /** Etapa de entrevista excluída */
  INTERVIEW_STAGE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.INTERVIEW_STAGE,
    module: AuditModule.HR,
    description: '{{userName}} excluiu a etapa de entrevista {{stageName}}',
  } satisfies AuditMessage,

  /** Etapas de entrevista reordenadas */
  INTERVIEW_STAGE_REORDER: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.INTERVIEW_STAGE,
    module: AuditModule.HR,
    description:
      '{{userName}} reordenou as etapas de entrevista da vaga {{jobPostingId}}',
  } satisfies AuditMessage,

  // ============================================================================
  // CONTRACT TEMPLATES & GENERATED EMPLOYMENT CONTRACTS
  // ============================================================================

  /** Modelo de contrato criado */
  CONTRACT_TEMPLATE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.CONTRACT,
    module: AuditModule.HR,
    description: '{{userName}} criou o modelo de contrato {{templateName}}',
  } satisfies AuditMessage,

  /** Modelo de contrato atualizado */
  CONTRACT_TEMPLATE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.CONTRACT,
    module: AuditModule.HR,
    description: '{{userName}} atualizou o modelo de contrato {{templateName}}',
  } satisfies AuditMessage,

  /** Modelo de contrato removido */
  CONTRACT_TEMPLATE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.CONTRACT,
    module: AuditModule.HR,
    description: '{{userName}} removeu o modelo de contrato {{templateName}}',
  } satisfies AuditMessage,

  /** Contrato de trabalho gerado para o funcionário */
  EMPLOYEE_CONTRACT_GENERATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.CONTRACT,
    module: AuditModule.HR,
    description:
      '{{userName}} gerou o contrato {{templateName}} para {{employeeName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // SALARY HISTORY - Histórico de mudanças salariais
  // ============================================================================

  /** Mudança salarial registrada manualmente */
  SALARY_CHANGE_REGISTER: {
    action: AuditAction.SALARY_CHANGE,
    entity: AuditEntity.SALARY_HISTORY,
    module: AuditModule.HR,
    description:
      '{{userName}} registrou alteração salarial de {{employeeName}}: {{previousSalary}} → {{newSalary}} ({{reason}})',
  } satisfies AuditMessage,

  /** Mudança salarial automática a partir de update no funcionário */
  SALARY_CHANGE_AUTO: {
    action: AuditAction.SALARY_CHANGE,
    entity: AuditEntity.SALARY_HISTORY,
    module: AuditModule.HR,
    description:
      '{{userName}} alterou o salário de {{employeeName}}: {{previousSalary}} → {{newSalary}}',
  } satisfies AuditMessage,

  // ============================================================================
  // ONE-ON-ONE MEETINGS - Reuniões 1:1 entre gestor e liderado
  // ============================================================================

  /** Reunião 1:1 agendada */
  ONE_ON_ONE_SCHEDULE: {
    action: AuditAction.ONE_ON_ONE_SCHEDULE,
    entity: AuditEntity.ONE_ON_ONE_MEETING,
    module: AuditModule.HR,
    description:
      '{{userName}} agendou uma reunião 1:1 com {{reportName}} para {{scheduledAt}}',
  } satisfies AuditMessage,

  /** Reunião 1:1 atualizada */
  ONE_ON_ONE_UPDATE: {
    action: AuditAction.ONE_ON_ONE_UPDATE,
    entity: AuditEntity.ONE_ON_ONE_MEETING,
    module: AuditModule.HR,
    description: '{{userName}} atualizou a reunião 1:1 com {{counterpartName}}',
  } satisfies AuditMessage,

  /** Reunião 1:1 cancelada */
  ONE_ON_ONE_CANCEL: {
    action: AuditAction.ONE_ON_ONE_CANCEL,
    entity: AuditEntity.ONE_ON_ONE_MEETING,
    module: AuditModule.HR,
    description: '{{userName}} cancelou a reunião 1:1 com {{counterpartName}}',
  } satisfies AuditMessage,

  /** Reunião 1:1 concluída */
  ONE_ON_ONE_COMPLETE: {
    action: AuditAction.ONE_ON_ONE_COMPLETE,
    entity: AuditEntity.ONE_ON_ONE_MEETING,
    module: AuditModule.HR,
    description: '{{userName}} concluiu a reunião 1:1 com {{counterpartName}}',
  } satisfies AuditMessage,

  /** Reunião 1:1 removida */
  ONE_ON_ONE_DELETE: {
    action: AuditAction.ONE_ON_ONE_DELETE,
    entity: AuditEntity.ONE_ON_ONE_MEETING,
    module: AuditModule.HR,
    description: '{{userName}} removeu a reunião 1:1 com {{counterpartName}}',
  } satisfies AuditMessage,

  /** Talking point adicionado a uma reunião 1:1 */
  TALKING_POINT_ADD: {
    action: AuditAction.TALKING_POINT_ADD,
    entity: AuditEntity.ONE_ON_ONE_TALKING_POINT,
    module: AuditModule.HR,
    description: '{{userName}} adicionou um tópico de discussão à reunião 1:1',
  } satisfies AuditMessage,

  /** Talking point atualizado */
  TALKING_POINT_UPDATE: {
    action: AuditAction.TALKING_POINT_UPDATE,
    entity: AuditEntity.ONE_ON_ONE_TALKING_POINT,
    module: AuditModule.HR,
    description: '{{userName}} atualizou um tópico de discussão da reunião 1:1',
  } satisfies AuditMessage,

  /** Talking point removido */
  TALKING_POINT_DELETE: {
    action: AuditAction.TALKING_POINT_DELETE,
    entity: AuditEntity.ONE_ON_ONE_TALKING_POINT,
    module: AuditModule.HR,
    description: '{{userName}} removeu um tópico de discussão da reunião 1:1',
  } satisfies AuditMessage,

  /** Action item criado em uma reunião 1:1 */
  ACTION_ITEM_ADD: {
    action: AuditAction.ACTION_ITEM_ADD,
    entity: AuditEntity.ONE_ON_ONE_ACTION_ITEM,
    module: AuditModule.HR,
    description:
      '{{userName}} adicionou uma ação para {{ownerName}} na reunião 1:1',
  } satisfies AuditMessage,

  /** Action item atualizado */
  ACTION_ITEM_UPDATE: {
    action: AuditAction.ACTION_ITEM_UPDATE,
    entity: AuditEntity.ONE_ON_ONE_ACTION_ITEM,
    module: AuditModule.HR,
    description: '{{userName}} atualizou uma ação da reunião 1:1',
  } satisfies AuditMessage,

  /** Action item removido */
  ACTION_ITEM_DELETE: {
    action: AuditAction.ACTION_ITEM_DELETE,
    entity: AuditEntity.ONE_ON_ONE_ACTION_ITEM,
    module: AuditModule.HR,
    description: '{{userName}} removeu uma ação da reunião 1:1',
  } satisfies AuditMessage,

  // ============================================================================
  // MEDICAL EXAMS (ASO) - NR-7 retention, LGPD Art. 11 sensitive health data
  // ============================================================================

  /**
   * Soft-delete de exame médico (NR-7 P0-02).
   *
   * Substitui o DELETE físico porque NR-7 item 7.4.4.3 exige retenção do ASO
   * por 20 anos após o desligamento do empregado. O registro continua na base
   * (com `deletedAt` preenchido) e só pode ser purgado explicitamente após o
   * prazo legal.
   */
  MEDICAL_EXAM_SOFT_DELETED: {
    action: AuditAction.DELETE,
    entity: AuditEntity.MEDICAL_EXAM,
    module: AuditModule.HR,
    description:
      '{{userName}} arquivou o exame médico do funcionário {{employeeName}} (retenção NR-7 de 20 anos)',
  } satisfies AuditMessage,

  // ============================================================================
  // COMPLIANCE PORTARIA 671 (Phase 6 / Plan 06-01)
  //
  // Templates intencionalmente baseados em IDs / labels (não PII) — `filters`
  // do ComplianceArtifact pode conter employeeId/cnpj/departmentIds, então a
  // mensagem usa apenas placeholders agregados (T-06-01-02 mitigation).
  // ============================================================================

  /** Artefato de compliance gerado (AFD/AFDT/folha-espelho/recibo/S1200) */
  COMPLIANCE_ARTIFACT_GENERATED: {
    action: AuditAction.COMPLIANCE_GENERATE,
    entity: AuditEntity.COMPLIANCE_ARTIFACT,
    module: AuditModule.HR,
    description:
      '{{userName}} gerou artefato de compliance "{{type}}" para o período {{period}}',
  } satisfies AuditMessage,

  /** Artefato de compliance baixado pelo usuário */
  COMPLIANCE_ARTIFACT_DOWNLOADED: {
    action: AuditAction.COMPLIANCE_DOWNLOAD,
    entity: AuditEntity.COMPLIANCE_ARTIFACT,
    module: AuditModule.HR,
    description:
      '{{userName}} baixou artefato de compliance "{{type}}" ({{artifactId}})',
  } satisfies AuditMessage,

  /**
   * Consulta pública de autenticidade de recibo (rota /v1/public/punch/verify
   * sem JWT). Não tem userName — userId fica como `system` ou null no audit
   * helper. nsrNumber e ipAddress são parte do payload obrigatório.
   */
  COMPLIANCE_PUBLIC_VERIFY_ACCESSED: {
    action: AuditAction.COMPLIANCE_VERIFY_PUBLIC,
    entity: AuditEntity.COMPLIANCE_ARTIFACT,
    module: AuditModule.HR,
    description:
      'Consulta pública de autenticidade do recibo NSR {{nsrNumber}} pelo IP {{ipAddress}}',
  } satisfies AuditMessage,

  /** Submissão de S-1200 ao eSocial (Plan 06-05) */
  ESOCIAL_S1200_SUBMITTED: {
    action: AuditAction.ESOCIAL_SUBMIT,
    entity: AuditEntity.COMPLIANCE_ARTIFACT,
    module: AuditModule.HR,
    description:
      '{{userName}} submeteu S-1200 da competência {{competencia}} ao eSocial (batch {{batchId}}, {{eventCount}} eventos)',
  } satisfies AuditMessage,

  /**
   * Upsert de mapeamento CLT → eSocial codRubr (Plan 06-05 / Review WR-05).
   * Usa `AuditAction.UPDATE` (e não `COMPLIANCE_GENERATE`) porque a operação
   * é de configuração, não de geração de artefato — isso evita poluir buscas
   * forenses por "artefatos gerados".
   */
  COMPLIANCE_RUBRICA_MAP_UPSERTED: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.COMPLIANCE_ARTIFACT,
    module: AuditModule.HR,
    description:
      '{{userName}} configurou mapeamento de rubrica "{{concept}}" (codRubr {{codRubr}})',
  } satisfies AuditMessage,

  // ============================================================================
  // Phase 9 / Plan 09-01 — Antifraude Audit (D-25, D-26)
  // ============================================================================

  /**
   * Admin marcou batida como suspeita de fraude no /hr/punch/audit (Plan 09-03).
   *
   * PII-safe: template usa apenas `{{userName}}` e `{{nsrNumber}}` — nunca
   * verbatim de filtros JSON (que poderiam vazar employeeId/cpf via audit log).
   * Lesson 06-01 incorporada (Pitfall 3).
   */
  PUNCH_AUDIT_MARK_SUSPICION: {
    action: AuditAction.PUNCH_AUDIT_MARK_SUSPICION,
    entity: AuditEntity.PUNCH_APPROVAL,
    module: AuditModule.HR,
    description:
      '{{userName}} marcou a batida {{nsrNumber}} como suspeita de fraude',
  } satisfies AuditMessage,

  /**
   * Admin abriu /hr/punch/audit com filtros aplicados (Plan 09-03).
   *
   * PII-safe: NÃO grava o conteúdo dos filtros (que pode incluir cpf/
   * employeeId/departmentIds). Apenas registra o ato de consulta — auditor
   * que precisar dos filtros exatos olha logs estruturados de aplicação.
   */
  PUNCH_AUDIT_VIEW: {
    action: AuditAction.PUNCH_AUDIT_VIEW,
    entity: AuditEntity.PUNCH_APPROVAL,
    module: AuditModule.HR,
    description:
      '{{userName}} consultou auditoria de ponto com filtros aplicados',
  } satisfies AuditMessage,
} as const;

export type HrAuditMessageKey = keyof typeof HR_AUDIT_MESSAGES;
