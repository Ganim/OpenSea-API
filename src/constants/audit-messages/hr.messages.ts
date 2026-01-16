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
    description: '{{adminName}} cadastrou o funcionário {{employeeName}}',
  } satisfies AuditMessage,

  /** Funcionário cadastrado com usuário vinculado */
  EMPLOYEE_CREATE_WITH_USER: {
    action: AuditAction.EMPLOYEE_HIRE,
    entity: AuditEntity.EMPLOYEE,
    module: AuditModule.HR,
    description:
      '{{adminName}} cadastrou o funcionário {{employeeName}} com acesso ao sistema',
  } satisfies AuditMessage,

  /** Dados do funcionário atualizados */
  EMPLOYEE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.EMPLOYEE,
    module: AuditModule.HR,
    description: '{{adminName}} atualizou os dados de {{employeeName}}',
  } satisfies AuditMessage,

  /** Funcionário excluído */
  EMPLOYEE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.EMPLOYEE,
    module: AuditModule.HR,
    description: '{{adminName}} excluiu o cadastro de {{employeeName}}',
  } satisfies AuditMessage,

  /** Funcionário desligado */
  EMPLOYEE_TERMINATE: {
    action: AuditAction.EMPLOYEE_TERMINATE,
    entity: AuditEntity.EMPLOYEE,
    module: AuditModule.HR,
    description: '{{adminName}} registrou desligamento de {{employeeName}}',
  } satisfies AuditMessage,

  /** Funcionário transferido */
  EMPLOYEE_TRANSFER: {
    action: AuditAction.EMPLOYEE_TRANSFER,
    entity: AuditEntity.EMPLOYEE,
    module: AuditModule.HR,
    description:
      '{{adminName}} transferiu {{employeeName}} de {{oldDepartment}} para {{newDepartment}}',
  } satisfies AuditMessage,

  /** Usuário vinculado ao funcionário */
  EMPLOYEE_LINK_USER: {
    action: AuditAction.EMPLOYEE_LINK_USER,
    entity: AuditEntity.EMPLOYEE,
    module: AuditModule.HR,
    description:
      '{{adminName}} vinculou o usuário {{userName}} ao funcionário {{employeeName}}',
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
    description: '{{adminName}} criou o departamento {{departmentName}}',
  } satisfies AuditMessage,

  /** Departamento atualizado */
  DEPARTMENT_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.DEPARTMENT,
    module: AuditModule.HR,
    description: '{{adminName}} atualizou o departamento {{departmentName}}',
  } satisfies AuditMessage,

  /** Departamento excluído */
  DEPARTMENT_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.DEPARTMENT,
    module: AuditModule.HR,
    description: '{{adminName}} excluiu o departamento {{departmentName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // POSITIONS - Gestão de cargos
  // ============================================================================

  /** Novo cargo criado */
  POSITION_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.POSITION,
    module: AuditModule.HR,
    description: '{{adminName}} criou o cargo {{positionName}}',
  } satisfies AuditMessage,

  /** Cargo atualizado */
  POSITION_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.POSITION,
    module: AuditModule.HR,
    description: '{{adminName}} atualizou o cargo {{positionName}}',
  } satisfies AuditMessage,

  /** Cargo excluído */
  POSITION_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.POSITION,
    module: AuditModule.HR,
    description: '{{adminName}} excluiu o cargo {{positionName}}',
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
    description: '{{adminName}} aprovou a ausência de {{employeeName}}',
  } satisfies AuditMessage,

  /** Ausência rejeitada */
  ABSENCE_REJECT: {
    action: AuditAction.ABSENCE_REJECT,
    entity: AuditEntity.ABSENCE,
    module: AuditModule.HR,
    description:
      '{{adminName}} rejeitou a ausência de {{employeeName}}: {{reason}}',
  } satisfies AuditMessage,

  /** Ausência cancelada */
  ABSENCE_CANCEL: {
    action: AuditAction.ABSENCE_CANCEL,
    entity: AuditEntity.ABSENCE,
    module: AuditModule.HR,
    description: '{{adminName}} cancelou a ausência de {{employeeName}}',
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
      '{{adminName}} criou período aquisitivo de férias para {{employeeName}}',
  } satisfies AuditMessage,

  /** Férias agendadas */
  VACATION_SCHEDULE: {
    action: AuditAction.VACATION_SCHEDULE,
    entity: AuditEntity.VACATION_PERIOD,
    module: AuditModule.HR,
    description:
      '{{adminName}} agendou férias de {{employeeName}} para {{startDate}} a {{endDate}}',
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
      '{{adminName}} cancelou as férias agendadas de {{employeeName}}',
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
      '{{adminName}} aprovou {{hours}} horas extras de {{employeeName}}',
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
      '{{adminName}} creditou {{hours}} horas no banco de {{employeeName}}',
  } satisfies AuditMessage,

  /** Débito no banco de horas */
  TIME_BANK_DEBIT: {
    action: AuditAction.TIME_BANK_DEBIT,
    entity: AuditEntity.TIME_BANK,
    module: AuditModule.HR,
    description:
      '{{adminName}} debitou {{hours}} horas do banco de {{employeeName}}',
  } satisfies AuditMessage,

  /** Ajuste no banco de horas */
  TIME_BANK_ADJUST: {
    action: AuditAction.TIME_BANK_ADJUST,
    entity: AuditEntity.TIME_BANK,
    module: AuditModule.HR,
    description:
      '{{adminName}} ajustou o banco de horas de {{employeeName}}: {{adjustment}}',
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
      '{{adminName}} criou a folha de pagamento de {{month}}/{{year}}',
  } satisfies AuditMessage,

  /** Folha de pagamento calculada */
  PAYROLL_CALCULATE: {
    action: AuditAction.PAYROLL_CALCULATE,
    entity: AuditEntity.PAYROLL,
    module: AuditModule.HR,
    description:
      '{{adminName}} calculou a folha de pagamento de {{month}}/{{year}}',
  } satisfies AuditMessage,

  /** Folha de pagamento aprovada */
  PAYROLL_APPROVE: {
    action: AuditAction.PAYROLL_APPROVE,
    entity: AuditEntity.PAYROLL,
    module: AuditModule.HR,
    description:
      '{{adminName}} aprovou a folha de pagamento de {{month}}/{{year}}',
  } satisfies AuditMessage,

  /** Folha de pagamento paga */
  PAYROLL_PAY: {
    action: AuditAction.PAYROLL_PAY,
    entity: AuditEntity.PAYROLL,
    module: AuditModule.HR,
    description:
      '{{adminName}} registrou pagamento da folha de {{month}}/{{year}}',
  } satisfies AuditMessage,

  /** Folha de pagamento cancelada */
  PAYROLL_CANCEL: {
    action: AuditAction.PAYROLL_CANCEL,
    entity: AuditEntity.PAYROLL,
    module: AuditModule.HR,
    description:
      '{{adminName}} cancelou a folha de pagamento de {{month}}/{{year}}',
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
      '{{adminName}} concedeu bônus de R$ {{amount}} para {{employeeName}}: {{description}}',
  } satisfies AuditMessage,

  /** Bônus excluído */
  BONUS_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.BONUS,
    module: AuditModule.HR,
    description: '{{adminName}} removeu bônus de {{employeeName}}',
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
      '{{adminName}} registrou desconto de R$ {{amount}} para {{employeeName}}: {{description}}',
  } satisfies AuditMessage,

  /** Desconto excluído */
  DEDUCTION_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.DEDUCTION,
    module: AuditModule.HR,
    description: '{{adminName}} removeu desconto de {{employeeName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // WORK SCHEDULES - Escalas de trabalho
  // ============================================================================

  /** Escala de trabalho criada */
  WORK_SCHEDULE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.WORK_SCHEDULE,
    module: AuditModule.HR,
    description: '{{adminName}} criou a escala de trabalho {{scheduleName}}',
  } satisfies AuditMessage,

  /** Escala de trabalho atualizada */
  WORK_SCHEDULE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.WORK_SCHEDULE,
    module: AuditModule.HR,
    description:
      '{{adminName}} atualizou a escala de trabalho {{scheduleName}}',
  } satisfies AuditMessage,

  /** Escala de trabalho excluída */
  WORK_SCHEDULE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.WORK_SCHEDULE,
    module: AuditModule.HR,
    description: '{{adminName}} excluiu a escala de trabalho {{scheduleName}}',
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
      '{{adminName}} cadastrou a empresa {{companyName}} (CNPJ: {{cnpj}})',
  } satisfies AuditMessage,

  /** Empresa atualizada */
  COMPANY_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.COMPANY,
    module: AuditModule.HR,
    description: '{{adminName}} atualizou os dados da empresa {{companyName}}',
  } satisfies AuditMessage,

  /** Empresa excluída */
  COMPANY_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.COMPANY,
    module: AuditModule.HR,
    description: '{{adminName}} excluiu a empresa {{companyName}}',
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
    description: '{{adminName}} adicionou endereço para {{companyName}}',
  } satisfies AuditMessage,

  /** Endereço de empresa atualizado */
  COMPANY_ADDRESS_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.COMPANY_ADDRESS,
    module: AuditModule.HR,
    description: '{{adminName}} atualizou endereço de {{companyName}}',
  } satisfies AuditMessage,

  /** Endereço de empresa excluído */
  COMPANY_ADDRESS_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.COMPANY_ADDRESS,
    module: AuditModule.HR,
    description: '{{adminName}} removeu endereço de {{companyName}}',
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
      '{{adminName}} adicionou CNAE {{cnaeCode}} para {{companyName}}',
  } satisfies AuditMessage,

  /** CNAE atualizado */
  COMPANY_CNAE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.COMPANY_CNAE,
    module: AuditModule.HR,
    description: '{{adminName}} atualizou CNAE de {{companyName}}',
  } satisfies AuditMessage,

  /** CNAE removido da empresa */
  COMPANY_CNAE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.COMPANY_CNAE,
    module: AuditModule.HR,
    description: '{{adminName}} removeu CNAE {{cnaeCode}} de {{companyName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // COMPANY FISCAL SETTINGS - Configurações fiscais
  // ============================================================================

  /** Configurações fiscais criadas */
  COMPANY_FISCAL_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.COMPANY_FISCAL_SETTINGS,
    module: AuditModule.HR,
    description: '{{adminName}} configurou dados fiscais de {{companyName}}',
  } satisfies AuditMessage,

  /** Configurações fiscais atualizadas */
  COMPANY_FISCAL_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.COMPANY_FISCAL_SETTINGS,
    module: AuditModule.HR,
    description: '{{adminName}} atualizou dados fiscais de {{companyName}}',
  } satisfies AuditMessage,

  /** Configurações fiscais excluídas */
  COMPANY_FISCAL_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.COMPANY_FISCAL_SETTINGS,
    module: AuditModule.HR,
    description: '{{adminName}} removeu dados fiscais de {{companyName}}',
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
      '{{adminName}} adicionou {{stakeholderName}} como sócio de {{companyName}}',
  } satisfies AuditMessage,

  /** Stakeholder atualizado */
  COMPANY_STAKEHOLDER_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.COMPANY_STAKEHOLDER,
    module: AuditModule.HR,
    description:
      '{{adminName}} atualizou dados de {{stakeholderName}} em {{companyName}}',
  } satisfies AuditMessage,

  /** Stakeholder removido */
  COMPANY_STAKEHOLDER_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.COMPANY_STAKEHOLDER,
    module: AuditModule.HR,
    description: '{{adminName}} removeu {{stakeholderName}} de {{companyName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // HR MANUFACTURERS - Fabricantes (no contexto HR)
  // ============================================================================

  /** Fabricante criado (HR) */
  HR_MANUFACTURER_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.MANUFACTURER,
    module: AuditModule.HR,
    description: '{{userName}} cadastrou o fabricante {{manufacturerName}}',
  } satisfies AuditMessage,

  /** Fabricante atualizado (HR) */
  HR_MANUFACTURER_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.MANUFACTURER,
    module: AuditModule.HR,
    description: '{{userName}} atualizou o fabricante {{manufacturerName}}',
  } satisfies AuditMessage,

  /** Fabricante excluído (HR) */
  HR_MANUFACTURER_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.MANUFACTURER,
    module: AuditModule.HR,
    description: '{{userName}} excluiu o fabricante {{manufacturerName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // HR SUPPLIERS - Fornecedores (no contexto HR)
  // ============================================================================

  /** Fornecedor criado (HR) */
  HR_SUPPLIER_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.SUPPLIER,
    module: AuditModule.HR,
    description: '{{userName}} cadastrou o fornecedor {{supplierName}}',
  } satisfies AuditMessage,

  /** Fornecedor atualizado (HR) */
  HR_SUPPLIER_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.SUPPLIER,
    module: AuditModule.HR,
    description: '{{userName}} atualizou o fornecedor {{supplierName}}',
  } satisfies AuditMessage,

  /** Fornecedor excluído (HR) */
  HR_SUPPLIER_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.SUPPLIER,
    module: AuditModule.HR,
    description: '{{userName}} excluiu o fornecedor {{supplierName}}',
  } satisfies AuditMessage,
} as const;

export type HrAuditMessageKey = keyof typeof HR_AUDIT_MESSAGES;
