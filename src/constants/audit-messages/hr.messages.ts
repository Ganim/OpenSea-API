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
} as const;

export type HrAuditMessageKey = keyof typeof HR_AUDIT_MESSAGES;
