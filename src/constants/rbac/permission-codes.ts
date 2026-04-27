/**
 * Permission Codes Constants
 *
 * 363 códigos de permissão organizados por módulo → recurso → ação
 * Fornece autocomplete e type-safety ao trabalhar com permissões
 *
 * Formato: module.resource-kebab.action
 * Exemplo: 'stock.products.access', 'hr.employees.admin'
 */

export const PermissionCodes = {
  // ============================================================================
  // STOCK — Estoque e produtos
  // ============================================================================
  STOCK: {
    PRODUCTS: {
      ACCESS: 'stock.products.access' as const,
      REGISTER: 'stock.products.register' as const,
      MODIFY: 'stock.products.modify' as const,
      REMOVE: 'stock.products.remove' as const,
      IMPORT: 'stock.products.import' as const,
      EXPORT: 'stock.products.export' as const,
      PRINT: 'stock.products.print' as const,
      ADMIN: 'stock.products.admin' as const,
      ONLYSELF: 'stock.products.onlyself' as const,
    },
    VARIANTS: {
      ACCESS: 'stock.variants.access' as const,
      REGISTER: 'stock.variants.register' as const,
      MODIFY: 'stock.variants.modify' as const,
      REMOVE: 'stock.variants.remove' as const,
      IMPORT: 'stock.variants.import' as const,
      EXPORT: 'stock.variants.export' as const,
      PRINT: 'stock.variants.print' as const,
      ADMIN: 'stock.variants.admin' as const,
      ONLYSELF: 'stock.variants.onlyself' as const,
    },
    TEMPLATES: {
      ACCESS: 'stock.templates.access' as const,
      REGISTER: 'stock.templates.register' as const,
      MODIFY: 'stock.templates.modify' as const,
      REMOVE: 'stock.templates.remove' as const,
      IMPORT: 'stock.templates.import' as const,
    },
    CATEGORIES: {
      ACCESS: 'stock.categories.access' as const,
      REGISTER: 'stock.categories.register' as const,
      MODIFY: 'stock.categories.modify' as const,
      REMOVE: 'stock.categories.remove' as const,
      IMPORT: 'stock.categories.import' as const,
      EXPORT: 'stock.categories.export' as const,
    },
    MANUFACTURERS: {
      ACCESS: 'stock.manufacturers.access' as const,
      REGISTER: 'stock.manufacturers.register' as const,
      MODIFY: 'stock.manufacturers.modify' as const,
      REMOVE: 'stock.manufacturers.remove' as const,
      IMPORT: 'stock.manufacturers.import' as const,
      EXPORT: 'stock.manufacturers.export' as const,
    },
    ITEMS: {
      ACCESS: 'stock.items.access' as const,
      EXPORT: 'stock.items.export' as const,
      PRINT: 'stock.items.print' as const,
      ADMIN: 'stock.items.admin' as const,
      IMPORT: 'stock.items.import' as const,
    },
    PURCHASE_ORDERS: {
      ACCESS: 'stock.purchase-orders.access' as const,
      REGISTER: 'stock.purchase-orders.register' as const,
      MODIFY: 'stock.purchase-orders.modify' as const,
      REMOVE: 'stock.purchase-orders.remove' as const,
      EXPORT: 'stock.purchase-orders.export' as const,
      PRINT: 'stock.purchase-orders.print' as const,
      ADMIN: 'stock.purchase-orders.admin' as const,
      ONLYSELF: 'stock.purchase-orders.onlyself' as const,
    },
    VOLUMES: {
      ACCESS: 'stock.volumes.access' as const,
      REGISTER: 'stock.volumes.register' as const,
      MODIFY: 'stock.volumes.modify' as const,
      REMOVE: 'stock.volumes.remove' as const,
      EXPORT: 'stock.volumes.export' as const,
      PRINT: 'stock.volumes.print' as const,
      ADMIN: 'stock.volumes.admin' as const,
      ONLYSELF: 'stock.volumes.onlyself' as const,
    },
    WAREHOUSES: {
      ACCESS: 'stock.warehouses.access' as const,
      REGISTER: 'stock.warehouses.register' as const,
      MODIFY: 'stock.warehouses.modify' as const,
      REMOVE: 'stock.warehouses.remove' as const,
      ADMIN: 'stock.warehouses.admin' as const,
    },
    INVENTORY: {
      ACCESS: 'stock.inventory.access' as const,
      REGISTER: 'stock.inventory.register' as const,
      MODIFY: 'stock.inventory.modify' as const,
      REMOVE: 'stock.inventory.remove' as const,
      ADMIN: 'stock.inventory.admin' as const,
      EXPORT: 'stock.inventory.export' as const,
      PRINT: 'stock.inventory.print' as const,
    },
  },

  // ============================================================================
  // FINANCE — Financeiro
  // ============================================================================
  FINANCE: {
    CHART_OF_ACCOUNTS: {
      ACCESS: 'finance.chart-of-accounts.access' as const,
      REGISTER: 'finance.chart-of-accounts.register' as const,
      MODIFY: 'finance.chart-of-accounts.modify' as const,
      REMOVE: 'finance.chart-of-accounts.remove' as const,
    },
    CATEGORIES: {
      ACCESS: 'finance.categories.access' as const,
      REGISTER: 'finance.categories.register' as const,
      MODIFY: 'finance.categories.modify' as const,
      REMOVE: 'finance.categories.remove' as const,
    },
    COST_CENTERS: {
      ACCESS: 'finance.cost-centers.access' as const,
      REGISTER: 'finance.cost-centers.register' as const,
      MODIFY: 'finance.cost-centers.modify' as const,
      REMOVE: 'finance.cost-centers.remove' as const,
    },
    BANK_ACCOUNTS: {
      ACCESS: 'finance.bank-accounts.access' as const,
      REGISTER: 'finance.bank-accounts.register' as const,
      MODIFY: 'finance.bank-accounts.modify' as const,
      REMOVE: 'finance.bank-accounts.remove' as const,
      ADMIN: 'finance.bank-accounts.admin' as const,
      IMPORT: 'finance.bank-accounts.import' as const,
    },
    SUPPLIERS: {
      ACCESS: 'finance.suppliers.access' as const,
      REGISTER: 'finance.suppliers.register' as const,
      MODIFY: 'finance.suppliers.modify' as const,
      REMOVE: 'finance.suppliers.remove' as const,
      IMPORT: 'finance.suppliers.import' as const,
      EXPORT: 'finance.suppliers.export' as const,
    },
    CONTRACTS: {
      ACCESS: 'finance.contracts.access' as const,
      REGISTER: 'finance.contracts.register' as const,
      MODIFY: 'finance.contracts.modify' as const,
      REMOVE: 'finance.contracts.remove' as const,
      EXPORT: 'finance.contracts.export' as const,
      PRINT: 'finance.contracts.print' as const,
    },
    ENTRIES: {
      ACCESS: 'finance.entries.access' as const,
      REGISTER: 'finance.entries.register' as const,
      MODIFY: 'finance.entries.modify' as const,
      REMOVE: 'finance.entries.remove' as const,
      IMPORT: 'finance.entries.import' as const,
      EXPORT: 'finance.entries.export' as const,
      PRINT: 'finance.entries.print' as const,
      ADMIN: 'finance.entries.admin' as const,
      ONLYSELF: 'finance.entries.onlyself' as const,
    },
    CONSORTIA: {
      ACCESS: 'finance.consortia.access' as const,
      REGISTER: 'finance.consortia.register' as const,
      MODIFY: 'finance.consortia.modify' as const,
      REMOVE: 'finance.consortia.remove' as const,
      EXPORT: 'finance.consortia.export' as const,
      ADMIN: 'finance.consortia.admin' as const,
      ONLYSELF: 'finance.consortia.onlyself' as const,
    },
    LOANS: {
      ACCESS: 'finance.loans.access' as const,
      REGISTER: 'finance.loans.register' as const,
      MODIFY: 'finance.loans.modify' as const,
      REMOVE: 'finance.loans.remove' as const,
      EXPORT: 'finance.loans.export' as const,
      ADMIN: 'finance.loans.admin' as const,
      ONLYSELF: 'finance.loans.onlyself' as const,
    },
    RECURRING: {
      ACCESS: 'finance.recurring.access' as const,
      REGISTER: 'finance.recurring.register' as const,
      MODIFY: 'finance.recurring.modify' as const,
      ADMIN: 'finance.recurring.admin' as const,
      ONLYSELF: 'finance.recurring.onlyself' as const,
    },
    PAYMENT_ORDERS: {
      ACCESS: 'finance.payment-orders.access' as const,
      REGISTER: 'finance.payment-orders.register' as const,
      MODIFY: 'finance.payment-orders.modify' as const,
      REMOVE: 'finance.payment-orders.remove' as const,
      APPROVE: 'finance.payment-orders.approve' as const,
      ADMIN: 'finance.payment-orders.admin' as const,
    },
    PAYMENT_LINKS: {
      ACCESS: 'finance.payment-links.access' as const,
      REGISTER: 'finance.payment-links.register' as const,
      MODIFY: 'finance.payment-links.modify' as const,
      REMOVE: 'finance.payment-links.remove' as const,
      ADMIN: 'finance.payment-links.admin' as const,
    },
    BOLETO: {
      ACCESS: 'finance.boleto.access' as const,
      REGISTER: 'finance.boleto.register' as const,
    },
    BUDGETS: {
      ACCESS: 'finance.budgets.access' as const,
      REGISTER: 'finance.budgets.register' as const,
      MODIFY: 'finance.budgets.modify' as const,
      REMOVE: 'finance.budgets.remove' as const,
    },
    COMPLIANCE: {
      ACCESS: 'finance.compliance.access' as const,
      EXPORT: 'finance.compliance.export' as const,
      MODIFY: 'finance.compliance.modify' as const,
    },
    JOURNAL_ENTRIES: {
      ACCESS: 'finance.journal-entries.access' as const,
      REGISTER: 'finance.journal-entries.register' as const,
      MODIFY: 'finance.journal-entries.modify' as const,
    },
    REPORTS: {
      ACCESS: 'finance.reports.access' as const,
      EXPORT: 'finance.reports.export' as const,
    },
    PERIOD_LOCKS: {
      ACCESS: 'finance.period-locks.access' as const,
      REGISTER: 'finance.period-locks.register' as const,
      REMOVE: 'finance.period-locks.remove' as const,
      ADMIN: 'finance.period-locks.admin' as const,
    },
    ACCOUNTANT: {
      ACCESS: 'finance.accountant.access' as const,
      REGISTER: 'finance.accountant.register' as const,
      ADMIN: 'finance.accountant.admin' as const,
    },
  },

  // ============================================================================
  // HR — Recursos Humanos
  // ============================================================================
  HR: {
    POSITIONS: {
      ACCESS: 'hr.positions.access' as const,
      REGISTER: 'hr.positions.register' as const,
      MODIFY: 'hr.positions.modify' as const,
      REMOVE: 'hr.positions.remove' as const,
      IMPORT: 'hr.positions.import' as const,
    },
    DEPARTMENTS: {
      ACCESS: 'hr.departments.access' as const,
      REGISTER: 'hr.departments.register' as const,
      MODIFY: 'hr.departments.modify' as const,
      REMOVE: 'hr.departments.remove' as const,
      IMPORT: 'hr.departments.import' as const,
    },
    WORK_SCHEDULES: {
      ACCESS: 'hr.work-schedules.access' as const,
      REGISTER: 'hr.work-schedules.register' as const,
      MODIFY: 'hr.work-schedules.modify' as const,
      REMOVE: 'hr.work-schedules.remove' as const,
    },
    SHIFTS: {
      ACCESS: 'hr.shifts.access' as const,
      REGISTER: 'hr.shifts.register' as const,
      MODIFY: 'hr.shifts.modify' as const,
      REMOVE: 'hr.shifts.remove' as const,
      ADMIN: 'hr.shifts.admin' as const,
    },
    EMPLOYEES: {
      ACCESS: 'hr.employees.access' as const,
      REGISTER: 'hr.employees.register' as const,
      MODIFY: 'hr.employees.modify' as const,
      REMOVE: 'hr.employees.remove' as const,
      IMPORT: 'hr.employees.import' as const,
      EXPORT: 'hr.employees.export' as const,
      PRINT: 'hr.employees.print' as const,
      ADMIN: 'hr.employees.admin' as const,
      ONLYSELF: 'hr.employees.onlyself' as const,
    },
    VACATIONS: {
      ACCESS: 'hr.vacations.access' as const,
      REGISTER: 'hr.vacations.register' as const,
      MODIFY: 'hr.vacations.modify' as const,
      ADMIN: 'hr.vacations.admin' as const,
      ONLYSELF: 'hr.vacations.onlyself' as const,
    },
    ABSENCES: {
      ACCESS: 'hr.absences.access' as const,
      REGISTER: 'hr.absences.register' as const,
      MODIFY: 'hr.absences.modify' as const,
      REMOVE: 'hr.absences.remove' as const,
      ADMIN: 'hr.absences.admin' as const,
      ONLYSELF: 'hr.absences.onlyself' as const,
    },
    WARNINGS: {
      ACCESS: 'hr.warnings.access' as const,
      REGISTER: 'hr.warnings.register' as const,
      MODIFY: 'hr.warnings.modify' as const,
      REMOVE: 'hr.warnings.remove' as const,
      ADMIN: 'hr.warnings.admin' as const,
    },
    PAYROLL: {
      ACCESS: 'hr.payroll.access' as const,
      REGISTER: 'hr.payroll.register' as const,
      EXPORT: 'hr.payroll.export' as const,
      PRINT: 'hr.payroll.print' as const,
      ADMIN: 'hr.payroll.admin' as const,
    },
    TIME_CONTROL: {
      ACCESS: 'hr.time-control.access' as const,
      REGISTER: 'hr.time-control.register' as const,
      EXPORT: 'hr.time-control.export' as const,
      PRINT: 'hr.time-control.print' as const,
      ADMIN: 'hr.time-control.admin' as const,
    },
    // PUNCH_DEVICES — cadastro/pareamento/revogação de dispositivos de ponto
    // (kiosk, PWA pessoal, leitor biométrico, WebAuthn PC). ADMIN cobre as
    // operações de pareamento/revogação (mais sensíveis que simples modify).
    PUNCH_DEVICES: {
      ACCESS: 'hr.punch-devices.access' as const,
      REGISTER: 'hr.punch-devices.register' as const,
      MODIFY: 'hr.punch-devices.modify' as const,
      REMOVE: 'hr.punch-devices.remove' as const,
      ADMIN: 'hr.punch-devices.admin' as const,
    },
    // PUNCH_APPROVALS — revisão de batidas que caíram em APPROVAL_REQUIRED
    // (ex.: fora de geofence). Plan 5 implementa o CRUD; este plan apenas
    // registra as permissões para que a bootstrap de seeds as reconheça.
    PUNCH_APPROVALS: {
      ACCESS: 'hr.punch-approvals.access' as const,
      MODIFY: 'hr.punch-approvals.modify' as const,
      ADMIN: 'hr.punch-approvals.admin' as const,
    },
    // Phase 9 / D-28 (4-level RBAC outside `tools` — ADR-031)
    // hr.compliance.* (Phase 6) was the first 4-level cluster outside `tools`.
    // hr.punch.audit.* is the second. parsePermissionCode (linhas ~1448-1466)
    // distingue ambos os shapes (3-level e 4-level) e absorve o sub-resource em
    // `resource` — ADR-024. Coexiste com HR.PUNCH_APPROVALS (3 níveis) e
    // HR.PUNCH_DEVICES (3 níveis) — nenhum conflito.
    //
    // Forensic audit é admin-only por design (D-28). NÃO entra em
    // DEFAULT_USER_PERMISSIONS — apenas admin/super-admin via
    // extractAllCodes(PermissionCodes) ou via backfill-phase9-permissions.ts.
    //
    // Sub-actions futuras previstas: EXPORT (export forense),
    // ADMIN (super-poder do módulo audit, eg. mark-suspicion override).
    PUNCH: {
      AUDIT: {
        ACCESS: 'hr.punch.audit.access' as const,
      },
    },
    // Phase 10 / Plan 10-01 — Agente biométrico (leitor DigitalPersona / Windows Hello).
    // Admin-only por design (D-J1): biometria é ferramenta de RH/admin, funcionário
    // comum não recebe self-service. Não está em DEFAULT_USER_PERMISSIONS —
    // admins recebem via extractAllCodes(PermissionCodes) + backfill script.
    //   - ACCESS: visualizar agentes pareados e status
    //   - ENROLL: gate de enrollment via verifyActionPin (Plan 10-04)
    //   - ADMIN: revogar agente, gerenciar configuração avançada
    PUNCH_BIO: {
      ACCESS: 'hr.bio.access' as const,
      ENROLL: 'hr.bio.enroll' as const,
      ADMIN: 'hr.bio.admin' as const,
    },
    // Phase 5 — enrollment biométrico do funcionário (kiosk + face match).
    // Admin-only por padrão (D-05): RH cadastra/remove a biometria; o
    // funcionário não tem self-service nesta fase. Não está em
    // `DEFAULT_USER_PERMISSIONS` — admins recebem via `extractAllCodes`.
    FACE_ENROLLMENT: {
      ACCESS: 'hr.face-enrollment.access' as const,
      REGISTER: 'hr.face-enrollment.register' as const,
      REMOVE: 'hr.face-enrollment.remove' as const,
      ADMIN: 'hr.face-enrollment.admin' as const,
    },
    // Phase 5 — impressão de crachás (PDF individual e em lote).
    // PRINT é o gate de geração; ADMIN cobre rotação de QR em massa
    // (operação que invalida crachás existentes).
    CRACHAS: {
      ACCESS: 'hr.crachas.access' as const,
      PRINT: 'hr.crachas.print' as const,
      ADMIN: 'hr.crachas.admin' as const,
    },
    // Phase 6 / Plan 06-01 — Compliance Portaria 671.
    // Admin-only por design (D-08): RH executa a geração de artefatos
    // (AFD/AFDT/folha-espelho/recibo/S-1200) e a configuração eSocial.
    // Funcionários NÃO recebem por default (não está em
    // DEFAULT_USER_PERMISSIONS) — gestores ganham via
    // extractAllCodes(PermissionCodes) ao serem admins.
    // Sub-actions granulares para permitir permissionamento fino:
    //   - access: ver dashboard /hr/compliance e listar artefatos
    //   - afd.generate / afdt.generate / folha-espelho.generate / s1200.submit:
    //     gates específicos por tipo de artefato (RH pode delegar geração
    //     de AFD sem expor S-1200, por exemplo)
    //   - artifact.download: baixar artefato existente
    //   - config.modify: editar EsocialConfig (certificado, ambiente)
    //   - admin: super-poder do módulo (cobre tudo + soft-delete artefato)
    COMPLIANCE: {
      ACCESS: 'hr.compliance.access' as const,
      AFD_GENERATE: 'hr.compliance.afd.generate' as const,
      AFDT_GENERATE: 'hr.compliance.afdt.generate' as const,
      FOLHA_ESPELHO_GENERATE: 'hr.compliance.folha-espelho.generate' as const,
      S1200_SUBMIT: 'hr.compliance.s1200.submit' as const,
      ARTIFACT_DOWNLOAD: 'hr.compliance.artifact.download' as const,
      CONFIG_MODIFY: 'hr.compliance.config.modify' as const,
      ADMIN: 'hr.compliance.admin' as const,
    },
    BONUSES: {
      ACCESS: 'hr.bonuses.access' as const,
      REGISTER: 'hr.bonuses.register' as const,
      MODIFY: 'hr.bonuses.modify' as const,
      REMOVE: 'hr.bonuses.remove' as const,
    },
    DEDUCTIONS: {
      ACCESS: 'hr.deductions.access' as const,
      REGISTER: 'hr.deductions.register' as const,
      MODIFY: 'hr.deductions.modify' as const,
      REMOVE: 'hr.deductions.remove' as const,
    },
    MEDICAL_EXAMS: {
      ACCESS: 'hr.medical-exams.access' as const,
      REGISTER: 'hr.medical-exams.register' as const,
      MODIFY: 'hr.medical-exams.modify' as const,
      REMOVE: 'hr.medical-exams.remove' as const,
      // ADMIN is reserved for SESMT / medical staff (P0-12): only this
      // permission allows reading `observations` / `restrictions` from the
      // ASO (Art. 11 LGPD + CLT Art. 169 sigilo médico) and is required
      // to soft-delete an ASO (NR-7 20-year retention guarantee — P0-02).
      ADMIN: 'hr.medical-exams.admin' as const,
    },
    SAFETY: {
      ACCESS: 'hr.safety.access' as const,
      REGISTER: 'hr.safety.register' as const,
      MODIFY: 'hr.safety.modify' as const,
      REMOVE: 'hr.safety.remove' as const,
      ADMIN: 'hr.safety.admin' as const,
    },
    PPE: {
      ACCESS: 'hr.ppe.access' as const,
      REGISTER: 'hr.ppe.register' as const,
      MODIFY: 'hr.ppe.modify' as const,
      REMOVE: 'hr.ppe.remove' as const,
      ADMIN: 'hr.ppe.admin' as const,
    },
    TRAINING: {
      ACCESS: 'hr.training.access' as const,
      REGISTER: 'hr.training.register' as const,
      MODIFY: 'hr.training.modify' as const,
      REMOVE: 'hr.training.remove' as const,
      ADMIN: 'hr.training.admin' as const,
    },
    REVIEWS: {
      ACCESS: 'hr.reviews.access' as const,
      REGISTER: 'hr.reviews.register' as const,
      MODIFY: 'hr.reviews.modify' as const,
      REMOVE: 'hr.reviews.remove' as const,
      ADMIN: 'hr.reviews.admin' as const,
    },
    BENEFITS: {
      ACCESS: 'hr.benefits.access' as const,
      REGISTER: 'hr.benefits.register' as const,
      MODIFY: 'hr.benefits.modify' as const,
      REMOVE: 'hr.benefits.remove' as const,
      ADMIN: 'hr.benefits.admin' as const,
    },
    ANNOUNCEMENTS: {
      ACCESS: 'hr.announcements.access' as const,
      REGISTER: 'hr.announcements.register' as const,
      MODIFY: 'hr.announcements.modify' as const,
      REMOVE: 'hr.announcements.remove' as const,
    },
    EMPLOYEE_REQUESTS: {
      ACCESS: 'hr.employee-requests.access' as const,
      REGISTER: 'hr.employee-requests.register' as const,
      ADMIN: 'hr.employee-requests.admin' as const,
    },
    KUDOS: {
      ACCESS: 'hr.kudos.access' as const,
      REGISTER: 'hr.kudos.register' as const,
      MODIFY: 'hr.kudos.modify' as const,
      ADMIN: 'hr.kudos.admin' as const,
    },
    DELEGATIONS: {
      ACCESS: 'hr.delegations.access' as const,
      REGISTER: 'hr.delegations.register' as const,
      REMOVE: 'hr.delegations.remove' as const,
    },
    ONBOARDING: {
      ACCESS: 'hr.onboarding.access' as const,
      REGISTER: 'hr.onboarding.register' as const,
      MODIFY: 'hr.onboarding.modify' as const,
      REMOVE: 'hr.onboarding.remove' as const,
      ADMIN: 'hr.onboarding.admin' as const,
    },
    OFFBOARDING: {
      ACCESS: 'hr.offboarding.access' as const,
      REGISTER: 'hr.offboarding.register' as const,
      MODIFY: 'hr.offboarding.modify' as const,
      REMOVE: 'hr.offboarding.remove' as const,
      ADMIN: 'hr.offboarding.admin' as const,
    },
    ADMISSIONS: {
      ACCESS: 'hr.admissions.access' as const,
      REGISTER: 'hr.admissions.register' as const,
      MODIFY: 'hr.admissions.modify' as const,
      REMOVE: 'hr.admissions.remove' as const,
      ADMIN: 'hr.admissions.admin' as const,
    },
    REPORTS: {
      ACCESS: 'hr.reports.access' as const,
      EXPORT: 'hr.reports.export' as const,
    },
    RECRUITMENT: {
      ACCESS: 'hr.recruitment.access' as const,
      REGISTER: 'hr.recruitment.register' as const,
      MODIFY: 'hr.recruitment.modify' as const,
      REMOVE: 'hr.recruitment.remove' as const,
      ADMIN: 'hr.recruitment.admin' as const,
    },
    SURVEYS: {
      ACCESS: 'hr.surveys.access' as const,
      REGISTER: 'hr.surveys.register' as const,
      MODIFY: 'hr.surveys.modify' as const,
      REMOVE: 'hr.surveys.remove' as const,
    },
    OKRS: {
      ACCESS: 'hr.okrs.access' as const,
      REGISTER: 'hr.okrs.register' as const,
      MODIFY: 'hr.okrs.modify' as const,
      REMOVE: 'hr.okrs.remove' as const,
    },
    CONTRACTS: {
      ACCESS: 'hr.contracts.access' as const,
      REGISTER: 'hr.contracts.register' as const,
      MODIFY: 'hr.contracts.modify' as const,
      REMOVE: 'hr.contracts.remove' as const,
    },
    SALARY: {
      ACCESS: 'hr.salary.access' as const,
      MODIFY: 'hr.salary.modify' as const,
      ADMIN: 'hr.salary.admin' as const,
    },
    ONE_ON_ONES: {
      ACCESS: 'hr.one-on-ones.access' as const,
      REGISTER: 'hr.one-on-ones.register' as const,
      MODIFY: 'hr.one-on-ones.modify' as const,
      REMOVE: 'hr.one-on-ones.remove' as const,
      ADMIN: 'hr.one-on-ones.admin' as const,
    },
  },

  // ============================================================================
  // SALES — Vendas
  // ============================================================================
  SALES: {
    // --- CRM: Clientes ---
    CUSTOMERS: {
      ACCESS: 'sales.customers.access' as const,
      REGISTER: 'sales.customers.register' as const,
      MODIFY: 'sales.customers.modify' as const,
      REMOVE: 'sales.customers.remove' as const,
      IMPORT: 'sales.customers.import' as const,
      EXPORT: 'sales.customers.export' as const,
      ONLYSELF: 'sales.customers.onlyself' as const,
      ADMIN: 'sales.customers.admin' as const,
    },
    // --- CRM: Contatos ---
    CONTACTS: {
      ACCESS: 'sales.contacts.access' as const,
      REGISTER: 'sales.contacts.register' as const,
      MODIFY: 'sales.contacts.modify' as const,
      REMOVE: 'sales.contacts.remove' as const,
      ADMIN: 'sales.contacts.admin' as const,
      ONLYSELF: 'sales.contacts.onlyself' as const,
    },
    // --- CRM: Negócios ---
    DEALS: {
      ACCESS: 'sales.deals.access' as const,
      REGISTER: 'sales.deals.register' as const,
      MODIFY: 'sales.deals.modify' as const,
      REMOVE: 'sales.deals.remove' as const,
      REASSIGN: 'sales.deals.reassign' as const,
      ADMIN: 'sales.deals.admin' as const,
      ONLYSELF: 'sales.deals.onlyself' as const,
    },
    // --- CRM: Pipelines ---
    PIPELINES: {
      ACCESS: 'sales.pipelines.access' as const,
      ADMIN: 'sales.pipelines.admin' as const,
    },
    // --- CRM: Blueprints ---
    BLUEPRINTS: {
      ACCESS: 'sales.blueprints.access' as const,
      REGISTER: 'sales.blueprints.register' as const,
      MODIFY: 'sales.blueprints.modify' as const,
      REMOVE: 'sales.blueprints.remove' as const,
      ADMIN: 'sales.blueprints.admin' as const,
    },
    // --- CRM: Atividades ---
    ACTIVITIES: {
      ACCESS: 'sales.activities.access' as const,
      REGISTER: 'sales.activities.register' as const,
    },
    // --- CRM: Conversas (Inbox) ---
    CONVERSATIONS: {
      ACCESS: 'sales.conversations.access' as const,
      REGISTER: 'sales.conversations.register' as const,
      MODIFY: 'sales.conversations.modify' as const,
      REMOVE: 'sales.conversations.remove' as const,
      REPLY: 'sales.conversations.reply' as const,
      REASSIGN: 'sales.conversations.reassign' as const,
      ADMIN: 'sales.conversations.admin' as const,
    },
    // --- Chatbot ---
    CHATBOT: {
      ACCESS: 'sales.chatbot.access' as const,
      MODIFY: 'sales.chatbot.modify' as const,
      ADMIN: 'sales.chatbot.admin' as const,
    },
    // --- AI Predictions ---
    PREDICTIONS: {
      ACCESS: 'sales.predictions.access' as const,
      EXECUTE: 'sales.predictions.execute' as const,
      ADMIN: 'sales.predictions.admin' as const,
    },
    // --- Sentiment Analysis ---
    SENTIMENT: {
      ACCESS: 'sales.sentiment.access' as const,
      EXECUTE: 'sales.sentiment.execute' as const,
    },
    // --- CRM: Workflows ---
    WORKFLOWS: {
      ACCESS: 'sales.workflows.access' as const,
      REGISTER: 'sales.workflows.register' as const,
      MODIFY: 'sales.workflows.modify' as const,
      REMOVE: 'sales.workflows.remove' as const,
      ADMIN: 'sales.workflows.admin' as const,
      EXECUTE: 'sales.workflows.execute' as const,
    },
    // --- CRM: Formulários ---
    FORMS: {
      ACCESS: 'sales.forms.access' as const,
      REGISTER: 'sales.forms.register' as const,
      MODIFY: 'sales.forms.modify' as const,
      REMOVE: 'sales.forms.remove' as const,
      ADMIN: 'sales.forms.admin' as const,
    },
    // --- CRM: Landing Pages ---
    LANDING_PAGES: {
      ACCESS: 'sales.landing-pages.access' as const,
      REGISTER: 'sales.landing-pages.register' as const,
      MODIFY: 'sales.landing-pages.modify' as const,
      REMOVE: 'sales.landing-pages.remove' as const,
      ADMIN: 'sales.landing-pages.admin' as const,
    },
    // --- CRM: Propostas ---
    PROPOSALS: {
      ACCESS: 'sales.proposals.access' as const,
      REGISTER: 'sales.proposals.register' as const,
      MODIFY: 'sales.proposals.modify' as const,
      REMOVE: 'sales.proposals.remove' as const,
      SEND: 'sales.proposals.send' as const,
      EXPORT: 'sales.proposals.export' as const,
      PRINT: 'sales.proposals.print' as const,
      ADMIN: 'sales.proposals.admin' as const,
    },
    // --- CRM: Templates de Mensagem ---
    MSG_TEMPLATES: {
      ACCESS: 'sales.msg-templates.access' as const,
      REGISTER: 'sales.msg-templates.register' as const,
      MODIFY: 'sales.msg-templates.modify' as const,
      REMOVE: 'sales.msg-templates.remove' as const,
      ADMIN: 'sales.msg-templates.admin' as const,
    },
    // --- Preços ---
    PRICE_TABLES: {
      ACCESS: 'sales.price-tables.access' as const,
      REGISTER: 'sales.price-tables.register' as const,
      MODIFY: 'sales.price-tables.modify' as const,
      REMOVE: 'sales.price-tables.remove' as const,
      ADMIN: 'sales.price-tables.admin' as const,
    },
    DISCOUNTS: {
      ACCESS: 'sales.discounts.access' as const,
      REGISTER: 'sales.discounts.register' as const,
      MODIFY: 'sales.discounts.modify' as const,
      REMOVE: 'sales.discounts.remove' as const,
      ADMIN: 'sales.discounts.admin' as const,
    },
    LEAD_SCORING: {
      ACCESS: 'sales.lead-scoring.access' as const,
      REGISTER: 'sales.lead-scoring.register' as const,
      MODIFY: 'sales.lead-scoring.modify' as const,
      REMOVE: 'sales.lead-scoring.remove' as const,
      ADMIN: 'sales.lead-scoring.admin' as const,
    },
    COUPONS: {
      ACCESS: 'sales.coupons.access' as const,
      REGISTER: 'sales.coupons.register' as const,
      MODIFY: 'sales.coupons.modify' as const,
      REMOVE: 'sales.coupons.remove' as const,
      ADMIN: 'sales.coupons.admin' as const,
    },
    CAMPAIGNS: {
      ACCESS: 'sales.campaigns.access' as const,
      REGISTER: 'sales.campaigns.register' as const,
      MODIFY: 'sales.campaigns.modify' as const,
      REMOVE: 'sales.campaigns.remove' as const,
      ADMIN: 'sales.campaigns.admin' as const,
      ACTIVATE: 'sales.campaigns.activate' as const,
    },
    COMBOS: {
      ACCESS: 'sales.combos.access' as const,
      REGISTER: 'sales.combos.register' as const,
      MODIFY: 'sales.combos.modify' as const,
      REMOVE: 'sales.combos.remove' as const,
      ADMIN: 'sales.combos.admin' as const,
    },
    // --- Promoções (existente) ---
    PROMOTIONS: {
      ACCESS: 'sales.promotions.access' as const,
      REGISTER: 'sales.promotions.register' as const,
      MODIFY: 'sales.promotions.modify' as const,
      REMOVE: 'sales.promotions.remove' as const,
    },
    // --- Pedidos (existente, expandido) ---
    ORDERS: {
      ACCESS: 'sales.orders.access' as const,
      REGISTER: 'sales.orders.register' as const,
      MODIFY: 'sales.orders.modify' as const,
      REMOVE: 'sales.orders.remove' as const,
      EXPORT: 'sales.orders.export' as const,
      PRINT: 'sales.orders.print' as const,
      ADMIN: 'sales.orders.admin' as const,
      ONLYSELF: 'sales.orders.onlyself' as const,
      CONFIRM: 'sales.orders.confirm' as const,
      APPROVE: 'sales.orders.approve' as const,
      CANCEL: 'sales.orders.cancel' as const,
    },
    // --- Créditos de Loja ---
    STORE_CREDITS: {
      ACCESS: 'sales.store-credits.access' as const,
      REGISTER: 'sales.store-credits.register' as const,
      REMOVE: 'sales.store-credits.remove' as const,
      ADMIN: 'sales.store-credits.admin' as const,
    },
    // --- Orçamentos ---
    QUOTES: {
      ACCESS: 'sales.quotes.access' as const,
      REGISTER: 'sales.quotes.register' as const,
      MODIFY: 'sales.quotes.modify' as const,
      REMOVE: 'sales.quotes.remove' as const,
      CONVERT: 'sales.quotes.convert' as const,
      SEND: 'sales.quotes.send' as const,
      PRINT: 'sales.quotes.print' as const,
      ONLYSELF: 'sales.quotes.onlyself' as const,
    },
    // --- Devoluções ---
    RETURNS: {
      ACCESS: 'sales.returns.access' as const,
      REGISTER: 'sales.returns.register' as const,
      APPROVE: 'sales.returns.approve' as const,
      ADMIN: 'sales.returns.admin' as const,
    },
    // --- Comissões ---
    COMMISSIONS: {
      ACCESS: 'sales.commissions.access' as const,
      ADMIN: 'sales.commissions.admin' as const,
      ONLYSELF: 'sales.commissions.onlyself' as const,
    },
    // --- Caixa ---
    CASHIER: {
      ACCESS: 'sales.cashier.access' as const,
      OPEN: 'sales.cashier.open' as const,
      CLOSE: 'sales.cashier.close' as const,
      WITHDRAW: 'sales.cashier.withdraw' as const,
      SUPPLY: 'sales.cashier.supply' as const,
      RECEIVE: 'sales.cashier.receive' as const,
      VERIFY: 'sales.cashier.verify' as const,
      OVERRIDE: 'sales.cashier.override' as const,
      ADMIN: 'sales.cashier.admin' as const,
    },
    // --- Licitações ---
    BIDS: {
      ACCESS: 'sales.bids.access' as const,
      REGISTER: 'sales.bids.register' as const,
      MODIFY: 'sales.bids.modify' as const,
      REMOVE: 'sales.bids.remove' as const,
      ADMIN: 'sales.bids.admin' as const,
    },
    BID_PROPOSALS: {
      ACCESS: 'sales.bid-proposals.access' as const,
      ADMIN: 'sales.bid-proposals.admin' as const,
      SEND: 'sales.bid-proposals.send' as const,
    },
    BID_BOT: {
      ACCESS: 'sales.bid-bot.access' as const,
      ADMIN: 'sales.bid-bot.admin' as const,
      ACTIVATE: 'sales.bid-bot.activate' as const,
    },
    BID_CONTRACTS: {
      ACCESS: 'sales.bid-contracts.access' as const,
      ADMIN: 'sales.bid-contracts.admin' as const,
      REGISTER: 'sales.bid-contracts.register' as const,
      MODIFY: 'sales.bid-contracts.modify' as const,
      REMOVE: 'sales.bid-contracts.remove' as const,
    },
    BID_DOCUMENTS: {
      ACCESS: 'sales.bid-documents.access' as const,
      ADMIN: 'sales.bid-documents.admin' as const,
      REGISTER: 'sales.bid-documents.register' as const,
      MODIFY: 'sales.bid-documents.modify' as const,
      REMOVE: 'sales.bid-documents.remove' as const,
    },
    // --- Catálogos e Conteúdo ---
    CATALOGS: {
      ACCESS: 'sales.catalogs.access' as const,
      REGISTER: 'sales.catalogs.register' as const,
      MODIFY: 'sales.catalogs.modify' as const,
      REMOVE: 'sales.catalogs.remove' as const,
      ADMIN: 'sales.catalogs.admin' as const,
      PUBLISH: 'sales.catalogs.publish' as const,
    },
    CONTENT: {
      ACCESS: 'sales.content.access' as const,
      REGISTER: 'sales.content.register' as const,
      REMOVE: 'sales.content.remove' as const,
      GENERATE: 'sales.content.generate' as const,
      PUBLISH: 'sales.content.publish' as const,
      APPROVE: 'sales.content.approve' as const,
      ADMIN: 'sales.content.admin' as const,
    },
    // --- Marketplaces ---
    MARKETPLACES: {
      ACCESS: 'sales.marketplaces.access' as const,
      ADMIN: 'sales.marketplaces.admin' as const,
      SYNC: 'sales.marketplaces.sync' as const,
    },
    // --- Analytics ---
    ANALYTICS: {
      ACCESS: 'sales.analytics.access' as const,
      ADMIN: 'sales.analytics.admin' as const,
      EXPORT: 'sales.analytics.export' as const,
      ONLYSELF: 'sales.analytics.onlyself' as const,
    },
    // --- Customer Prices ---
    CUSTOMER_PRICES: {
      ACCESS: 'sales.customer-prices.access' as const,
      REGISTER: 'sales.customer-prices.register' as const,
      MODIFY: 'sales.customer-prices.modify' as const,
      REMOVE: 'sales.customer-prices.remove' as const,
    },
    // --- Brand ---
    BRAND: {
      ACCESS: 'sales.brand.access' as const,
      MODIFY: 'sales.brand.modify' as const,
    },
    ANALYTICS_GOALS: {
      ACCESS: 'sales.analytics-goals.access' as const,
      REGISTER: 'sales.analytics-goals.register' as const,
      MODIFY: 'sales.analytics-goals.modify' as const,
      REMOVE: 'sales.analytics-goals.remove' as const,
    },
    ANALYTICS_REPORTS: {
      ACCESS: 'sales.analytics-reports.access' as const,
      REGISTER: 'sales.analytics-reports.register' as const,
      MODIFY: 'sales.analytics-reports.modify' as const,
      REMOVE: 'sales.analytics-reports.remove' as const,
      GENERATE: 'sales.analytics-reports.generate' as const,
    },
    ANALYTICS_DASHBOARDS: {
      ACCESS: 'sales.analytics-dashboards.access' as const,
      REGISTER: 'sales.analytics-dashboards.register' as const,
      MODIFY: 'sales.analytics-dashboards.modify' as const,
      REMOVE: 'sales.analytics-dashboards.remove' as const,
    },
    ANALYTICS_RANKINGS: {
      ACCESS: 'sales.analytics-rankings.access' as const,
    },
    CUSTOMER_PORTAL: {
      ACCESS: 'sales.customer-portal.access' as const,
      REGISTER: 'sales.customer-portal.register' as const,
      REMOVE: 'sales.customer-portal.remove' as const,
    },
    BID_EMPENHOS: {
      ACCESS: 'sales.bid-empenhos.access' as const,
      REGISTER: 'sales.bid-empenhos.register' as const,
      MODIFY: 'sales.bid-empenhos.modify' as const,
    },
    MARKETPLACE_CONNECTIONS: {
      ACCESS: 'sales.marketplace-connections.access' as const,
      REGISTER: 'sales.marketplace-connections.register' as const,
      MODIFY: 'sales.marketplace-connections.modify' as const,
      REMOVE: 'sales.marketplace-connections.remove' as const,
    },
    MARKETPLACE_LISTINGS: {
      ACCESS: 'sales.marketplace-listings.access' as const,
      REGISTER: 'sales.marketplace-listings.register' as const,
      MODIFY: 'sales.marketplace-listings.modify' as const,
      REMOVE: 'sales.marketplace-listings.remove' as const,
    },
    MARKETPLACE_ORDERS: {
      ACCESS: 'sales.marketplace-orders.access' as const,
      REGISTER: 'sales.marketplace-orders.register' as const,
      MODIFY: 'sales.marketplace-orders.modify' as const,
      REMOVE: 'sales.marketplace-orders.remove' as const,
    },
    MARKETPLACE_PAYMENTS: {
      ACCESS: 'sales.marketplace-payments.access' as const,
      REGISTER: 'sales.marketplace-payments.register' as const,
      MODIFY: 'sales.marketplace-payments.modify' as const,
      REMOVE: 'sales.marketplace-payments.remove' as const,
    },
    // --- Lead Routing ---
    LEAD_ROUTING: {
      ACCESS: 'sales.lead-routing.access' as const,
      REGISTER: 'sales.lead-routing.register' as const,
      MODIFY: 'sales.lead-routing.modify' as const,
      REMOVE: 'sales.lead-routing.remove' as const,
      ADMIN: 'sales.lead-routing.admin' as const,
    },
    // --- Integrations Hub ---
    INTEGRATIONS: {
      ACCESS: 'sales.integrations.access' as const,
      REGISTER: 'sales.integrations.register' as const,
      MODIFY: 'sales.integrations.modify' as const,
      ADMIN: 'sales.integrations.admin' as const,
    },
    // --- PDV ---
    POS: {
      ACCESS: 'sales.pos.access' as const,
      SELL: 'sales.pos.sell' as const,
      CANCEL: 'sales.pos.cancel' as const,
      OVERRIDE: 'sales.pos.override' as const,
      ADMIN: 'sales.pos.admin' as const,
      ONLYSELF: 'sales.pos.onlyself' as const,
      OPERATE: 'sales.pos.operate' as const,
      CONFLICTS_RESOLVE: 'sales.pos.conflicts-resolve' as const,
      PROFILES_MANAGE: 'sales.pos.profiles-manage' as const,
      FISCAL_CONFIGURE: 'sales.pos.fiscal-configure' as const,
      ORPHAN_PAYMENTS_RECONCILE: 'sales.pos.orphan-payments-reconcile' as const,
      TERMINALS: {
        ACCESS: 'sales.pos.terminals.access' as const,
        REGISTER: 'sales.pos.terminals.register' as const,
        MODIFY: 'sales.pos.terminals.modify' as const,
        REMOVE: 'sales.pos.terminals.remove' as const,
        PAIR: 'sales.pos.terminals.pair' as const,
        UNPAIR: 'sales.pos.terminals.unpair' as const,
      },
      SESSIONS: {
        ACCESS: 'sales.pos.sessions.access' as const,
        OPEN: 'sales.pos.sessions.open' as const,
        CLOSE: 'sales.pos.sessions.close' as const,
        CLOSE_ORPHAN: 'sales.pos.sessions.close-orphan' as const,
      },
      TRANSACTIONS: {
        ACCESS: 'sales.pos.transactions.access' as const,
        REGISTER: 'sales.pos.transactions.register' as const,
        CANCEL: 'sales.pos.transactions.cancel' as const,
      },
      CASH: {
        ACCESS: 'sales.pos.cash.access' as const,
        WITHDRAWAL: 'sales.pos.cash.withdrawal' as const,
        SUPPLY: 'sales.pos.cash.supply' as const,
      },
      RECEIVE: 'sales.pos.receive' as const,
    },
    // --- Cadências ---
    CADENCES: {
      ACCESS: 'sales.cadences.access' as const,
      REGISTER: 'sales.cadences.register' as const,
      MODIFY: 'sales.cadences.modify' as const,
      REMOVE: 'sales.cadences.remove' as const,
      ADMIN: 'sales.cadences.admin' as const,
      EXECUTE: 'sales.cadences.execute' as const,
    },
    // --- Emissão de Notas Fiscais ---
    INVOICING: {
      ACCESS: 'sales.invoicing.access' as const,
      REGISTER: 'sales.invoicing.register' as const,
      REMOVE: 'sales.invoicing.remove' as const,
      ADMIN: 'sales.invoicing.admin' as const,
    },
    PRINTING: {
      ACCESS: 'sales.printing.access' as const,
      PRINT: 'sales.printing.print' as const,
      ADMIN: 'sales.printing.admin' as const,
    },
  },

  // ============================================================================
  // ADMIN — Administração do tenant
  // ============================================================================
  ADMIN: {
    USERS: {
      ACCESS: 'admin.users.access' as const,
      REGISTER: 'admin.users.register' as const,
      MODIFY: 'admin.users.modify' as const,
      REMOVE: 'admin.users.remove' as const,
      ADMIN: 'admin.users.admin' as const,
      IMPORT: 'admin.users.import' as const,
      SECURITY: {
        SET_PASSWORD: 'admin.users.security.setPassword' as const,
        REVEAL_ADMIN_TOKEN: 'admin.users.security.revealAdminToken' as const,
      },
    },
    PERMISSION_GROUPS: {
      ACCESS: 'admin.permission-groups.access' as const,
      REGISTER: 'admin.permission-groups.register' as const,
      MODIFY: 'admin.permission-groups.modify' as const,
      REMOVE: 'admin.permission-groups.remove' as const,
      ADMIN: 'admin.permission-groups.admin' as const,
    },
    COMPANIES: {
      ACCESS: 'admin.companies.access' as const,
      REGISTER: 'admin.companies.register' as const,
      MODIFY: 'admin.companies.modify' as const,
      REMOVE: 'admin.companies.remove' as const,
      ADMIN: 'admin.companies.admin' as const,
      IMPORT: 'admin.companies.import' as const,
    },
    SESSIONS: {
      ACCESS: 'admin.sessions.access' as const,
      ADMIN: 'admin.sessions.admin' as const,
    },
    AUDIT: {
      ACCESS: 'admin.audit.access' as const,
      EXPORT: 'admin.audit.export' as const,
      ADMIN: 'admin.audit.admin' as const,
    },
    SETTINGS: {
      ACCESS: 'admin.settings.access' as const,
      ADMIN: 'admin.settings.admin' as const,
    },
  },

  // ============================================================================
  // TOOLS — Ferramentas de produtividade
  // ============================================================================
  TOOLS: {
    EMAIL: {
      ACCOUNTS: {
        ACCESS: 'tools.email.accounts.access' as const,
        REGISTER: 'tools.email.accounts.register' as const,
        MODIFY: 'tools.email.accounts.modify' as const,
        REMOVE: 'tools.email.accounts.remove' as const,
        ADMIN: 'tools.email.accounts.admin' as const,
        SHARE: 'tools.email.accounts.share' as const,
      },
      MESSAGES: {
        ACCESS: 'tools.email.messages.access' as const,
        REGISTER: 'tools.email.messages.register' as const,
        MODIFY: 'tools.email.messages.modify' as const,
        REMOVE: 'tools.email.messages.remove' as const,
        ONLYSELF: 'tools.email.messages.onlyself' as const,
      },
    },
    TASKS: {
      BOARDS: {
        ACCESS: 'tools.tasks.boards.access' as const,
        REGISTER: 'tools.tasks.boards.register' as const,
        MODIFY: 'tools.tasks.boards.modify' as const,
        REMOVE: 'tools.tasks.boards.remove' as const,
        SHARE: 'tools.tasks.boards.share' as const,
      },
      CARDS: {
        ACCESS: 'tools.tasks.cards.access' as const,
        REGISTER: 'tools.tasks.cards.register' as const,
        MODIFY: 'tools.tasks.cards.modify' as const,
        REMOVE: 'tools.tasks.cards.remove' as const,
        ADMIN: 'tools.tasks.cards.admin' as const,
        SHARE: 'tools.tasks.cards.share' as const,
        ONLYSELF: 'tools.tasks.cards.onlyself' as const,
      },
      COMMENTS: {
        ACCESS: 'tools.tasks.comments.access' as const,
        REGISTER: 'tools.tasks.comments.register' as const,
        MODIFY: 'tools.tasks.comments.modify' as const,
        REMOVE: 'tools.tasks.comments.remove' as const,
      },
      ATTACHMENTS: {
        ACCESS: 'tools.tasks.attachments.access' as const,
        REGISTER: 'tools.tasks.attachments.register' as const,
        REMOVE: 'tools.tasks.attachments.remove' as const,
      },
      LABELS: {
        ACCESS: 'tools.tasks.labels.access' as const,
        REGISTER: 'tools.tasks.labels.register' as const,
        MODIFY: 'tools.tasks.labels.modify' as const,
        REMOVE: 'tools.tasks.labels.remove' as const,
      },
      CHECKLISTS: {
        ACCESS: 'tools.tasks.checklists.access' as const,
        REGISTER: 'tools.tasks.checklists.register' as const,
        MODIFY: 'tools.tasks.checklists.modify' as const,
        REMOVE: 'tools.tasks.checklists.remove' as const,
      },
      CUSTOM_FIELDS: {
        ACCESS: 'tools.tasks.customfields.access' as const,
        REGISTER: 'tools.tasks.customfields.register' as const,
        MODIFY: 'tools.tasks.customfields.modify' as const,
        REMOVE: 'tools.tasks.customfields.remove' as const,
      },
    },
    CALENDAR: {
      ACCESS: 'tools.calendar.access' as const,
      REGISTER: 'tools.calendar.register' as const,
      MODIFY: 'tools.calendar.modify' as const,
      REMOVE: 'tools.calendar.remove' as const,
      EXPORT: 'tools.calendar.export' as const,
      ADMIN: 'tools.calendar.admin' as const,
      SHARE: 'tools.calendar.share' as const,
      ONLYSELF: 'tools.calendar.onlyself' as const,
    },
    STORAGE: {
      FOLDERS: {
        ACCESS: 'tools.storage.folders.access' as const,
        REGISTER: 'tools.storage.folders.register' as const,
        MODIFY: 'tools.storage.folders.modify' as const,
        REMOVE: 'tools.storage.folders.remove' as const,
        ADMIN: 'tools.storage.folders.admin' as const,
        SHARE: 'tools.storage.folders.share' as const,
      },
      FILES: {
        ACCESS: 'tools.storage.files.access' as const,
        REGISTER: 'tools.storage.files.register' as const,
        MODIFY: 'tools.storage.files.modify' as const,
        REMOVE: 'tools.storage.files.remove' as const,
        ADMIN: 'tools.storage.files.admin' as const,
        SHARE: 'tools.storage.files.share' as const,
        ONLYSELF: 'tools.storage.files.onlyself' as const,
      },
    },
    SIGNATURE: {
      ENVELOPES: {
        ACCESS: 'tools.signature.envelopes.access' as const,
        REGISTER: 'tools.signature.envelopes.register' as const,
        MODIFY: 'tools.signature.envelopes.modify' as const,
        REMOVE: 'tools.signature.envelopes.remove' as const,
        ADMIN: 'tools.signature.envelopes.admin' as const,
      },
      CERTIFICATES: {
        ACCESS: 'tools.signature.certificates.access' as const,
        REGISTER: 'tools.signature.certificates.register' as const,
        REMOVE: 'tools.signature.certificates.remove' as const,
        ADMIN: 'tools.signature.certificates.admin' as const,
      },
      TEMPLATES: {
        ACCESS: 'tools.signature.templates.access' as const,
        REGISTER: 'tools.signature.templates.register' as const,
        MODIFY: 'tools.signature.templates.modify' as const,
        REMOVE: 'tools.signature.templates.remove' as const,
      },
    },
    MESSAGING: {
      ACCOUNTS: {
        ACCESS: 'tools.messaging.accounts.access' as const,
        REGISTER: 'tools.messaging.accounts.register' as const,
        MODIFY: 'tools.messaging.accounts.modify' as const,
        REMOVE: 'tools.messaging.accounts.remove' as const,
        ADMIN: 'tools.messaging.accounts.admin' as const,
      },
      CONTACTS: {
        ACCESS: 'tools.messaging.contacts.access' as const,
      },
      MESSAGES: {
        ACCESS: 'tools.messaging.messages.access' as const,
        REGISTER: 'tools.messaging.messages.register' as const,
      },
    },
    AI: {
      CHAT: {
        ACCESS: 'tools.ai.chat.access' as const,
      },
      INSIGHTS: {
        ACCESS: 'tools.ai.insights.access' as const,
      },
      CONFIG: {
        ACCESS: 'tools.ai.config.access' as const,
        MODIFY: 'tools.ai.config.modify' as const,
      },
      FAVORITES: {
        ACCESS: 'tools.ai.favorites.access' as const,
        REGISTER: 'tools.ai.favorites.register' as const,
        REMOVE: 'tools.ai.favorites.remove' as const,
      },
      ACTIONS: {
        ACCESS: 'tools.ai.actions.access' as const,
      },
    },
    NOTIFICATIONS: {
      ACCESS: 'tools.notifications.access' as const,
      PREFERENCES: {
        ACCESS: 'tools.notifications.preferences.access' as const,
        MODIFY: 'tools.notifications.preferences.modify' as const,
      },
      DEVICES: {
        ADMIN: 'tools.notifications.devices.admin' as const,
      },
    },
  },

  // ============================================================================
  // SYSTEM — Sistema e configurações
  // ============================================================================
  SYSTEM: {
    LABEL_TEMPLATES: {
      ACCESS: 'system.label-templates.access' as const,
      REGISTER: 'system.label-templates.register' as const,
      MODIFY: 'system.label-templates.modify' as const,
      REMOVE: 'system.label-templates.remove' as const,
    },
    FISCAL: {
      ACCESS: 'system.fiscal.access' as const,
      REGISTER: 'system.fiscal.register' as const,
      MODIFY: 'system.fiscal.modify' as const,
      ADMIN: 'system.fiscal.admin' as const,
    },
    NOTIFICATIONS: {
      ADMIN: 'system.notifications.admin' as const,
    },
    SELF: {
      ACCESS: 'system.self.access' as const,
      MODIFY: 'system.self.modify' as const,
      ADMIN: 'system.self.admin' as const,
    },
    // Phase 11 — Webhooks outbound (4-level — ADR-031, quarto cluster fora de tools).
    // Precedentes: hr.compliance.* (Phase 6), hr.punch.audit.* (Phase 9),
    // agora system.webhooks.endpoints.*. D-10: admin-only — NÃO entra em
    // DEFAULT_USER_PERMISSIONS; admins recebem via extractAllCodes (recursão
    // genérica já cobre 4 níveis — ver permission-codes.spec.ts) + backfill
    // script idempotente prisma/backfill-phase11-permissions.ts.
    WEBHOOKS: {
      ENDPOINTS: {
        ACCESS: 'system.webhooks.endpoints.access' as const,
        REGISTER: 'system.webhooks.endpoints.register' as const,
        MODIFY: 'system.webhooks.endpoints.modify' as const,
        REMOVE: 'system.webhooks.endpoints.remove' as const,
        ADMIN: 'system.webhooks.endpoints.admin' as const,
      },
    },
  },

  // ============================================================================
  // ESOCIAL — eSocial compliance module
  // ============================================================================
  ESOCIAL: {
    CONFIG: {
      ACCESS: 'esocial.config.access' as const,
      MODIFY: 'esocial.config.modify' as const,
      ADMIN: 'esocial.config.admin' as const,
    },
    EVENTS: {
      ACCESS: 'esocial.events.access' as const,
      REGISTER: 'esocial.events.register' as const,
      MODIFY: 'esocial.events.modify' as const,
      REMOVE: 'esocial.events.remove' as const,
      APPROVE: 'esocial.events.approve' as const,
      TRANSMIT: 'esocial.events.transmit' as const,
      EXPORT: 'esocial.events.export' as const,
    },
    RUBRICAS: {
      ACCESS: 'esocial.rubricas.access' as const,
      REGISTER: 'esocial.rubricas.register' as const,
      MODIFY: 'esocial.rubricas.modify' as const,
      REMOVE: 'esocial.rubricas.remove' as const,
    },
    TABLES: {
      ACCESS: 'esocial.tables.access' as const,
    },
    CERTIFICATES: {
      ACCESS: 'esocial.certificates.access' as const,
      ADMIN: 'esocial.certificates.admin' as const,
    },
  },

  // ============================================================================
  // PRODUCTION — Controle de Produção
  // ============================================================================
  PRODUCTION: {
    ENGINEERING: {
      ACCESS: 'production.engineering.access' as const,
      REGISTER: 'production.engineering.register' as const,
      MODIFY: 'production.engineering.modify' as const,
      REMOVE: 'production.engineering.remove' as const,
      ADMIN: 'production.engineering.admin' as const,
    },
    ORDERS: {
      ACCESS: 'production.orders.access' as const,
      REGISTER: 'production.orders.register' as const,
      MODIFY: 'production.orders.modify' as const,
      REMOVE: 'production.orders.remove' as const,
      EXPORT: 'production.orders.export' as const,
      PRINT: 'production.orders.print' as const,
      ADMIN: 'production.orders.admin' as const,
    },
    SHOPFLOOR: {
      ACCESS: 'production.shopfloor.access' as const,
      REGISTER: 'production.shopfloor.register' as const,
      MODIFY: 'production.shopfloor.modify' as const,
      ADMIN: 'production.shopfloor.admin' as const,
    },
    PLANNING: {
      ACCESS: 'production.planning.access' as const,
      REGISTER: 'production.planning.register' as const,
      MODIFY: 'production.planning.modify' as const,
      ADMIN: 'production.planning.admin' as const,
    },
    QUALITY: {
      ACCESS: 'production.quality.access' as const,
      REGISTER: 'production.quality.register' as const,
      MODIFY: 'production.quality.modify' as const,
      ADMIN: 'production.quality.admin' as const,
    },
    COSTING: {
      ACCESS: 'production.costing.access' as const,
      ADMIN: 'production.costing.admin' as const,
    },
    ANALYTICS: {
      ACCESS: 'production.analytics.access' as const,
      EXPORT: 'production.analytics.export' as const,
    },
  },
} as const;

// =============================================================================
// DEFAULT_USER_PERMISSIONS — Permissões concedidas automaticamente a todo usuário
// =============================================================================
export const DEFAULT_USER_PERMISSIONS: string[] = [
  // system.self — acesso completo ao próprio perfil
  PermissionCodes.SYSTEM.SELF.ACCESS,
  PermissionCodes.SYSTEM.SELF.MODIFY,
  PermissionCodes.SYSTEM.SELF.ADMIN,

  // system.label-templates — apenas visualizar
  PermissionCodes.SYSTEM.LABEL_TEMPLATES.ACCESS,

  // tools.email.accounts — visualizar contas compartilhadas
  PermissionCodes.TOOLS.EMAIL.ACCOUNTS.ACCESS,

  // tools.email.messages — gerenciar próprios e-mails
  PermissionCodes.TOOLS.EMAIL.MESSAGES.ACCESS,
  PermissionCodes.TOOLS.EMAIL.MESSAGES.REGISTER,
  PermissionCodes.TOOLS.EMAIL.MESSAGES.MODIFY,
  PermissionCodes.TOOLS.EMAIL.MESSAGES.REMOVE,
  PermissionCodes.TOOLS.EMAIL.MESSAGES.ONLYSELF,

  // tools.tasks.boards — visualizar quadros
  PermissionCodes.TOOLS.TASKS.BOARDS.ACCESS,

  // tools.tasks.cards — gerenciar próprios cards
  PermissionCodes.TOOLS.TASKS.CARDS.ACCESS,
  PermissionCodes.TOOLS.TASKS.CARDS.REGISTER,
  PermissionCodes.TOOLS.TASKS.CARDS.MODIFY,
  PermissionCodes.TOOLS.TASKS.CARDS.REMOVE,
  PermissionCodes.TOOLS.TASKS.CARDS.ONLYSELF,

  // tools.tasks.comments — gerenciar comentários em cards
  PermissionCodes.TOOLS.TASKS.COMMENTS.ACCESS,
  PermissionCodes.TOOLS.TASKS.COMMENTS.REGISTER,
  PermissionCodes.TOOLS.TASKS.COMMENTS.MODIFY,
  PermissionCodes.TOOLS.TASKS.COMMENTS.REMOVE,

  // tools.tasks.attachments — gerenciar anexos em cards
  PermissionCodes.TOOLS.TASKS.ATTACHMENTS.ACCESS,
  PermissionCodes.TOOLS.TASKS.ATTACHMENTS.REGISTER,
  PermissionCodes.TOOLS.TASKS.ATTACHMENTS.REMOVE,

  // tools.tasks.labels — gerenciar etiquetas de quadros
  PermissionCodes.TOOLS.TASKS.LABELS.ACCESS,
  PermissionCodes.TOOLS.TASKS.LABELS.REGISTER,
  PermissionCodes.TOOLS.TASKS.LABELS.MODIFY,
  PermissionCodes.TOOLS.TASKS.LABELS.REMOVE,

  // tools.tasks.checklists — gerenciar checklists em cards
  PermissionCodes.TOOLS.TASKS.CHECKLISTS.ACCESS,
  PermissionCodes.TOOLS.TASKS.CHECKLISTS.REGISTER,
  PermissionCodes.TOOLS.TASKS.CHECKLISTS.MODIFY,
  PermissionCodes.TOOLS.TASKS.CHECKLISTS.REMOVE,

  // tools.tasks.customfields — gerenciar campos personalizados
  PermissionCodes.TOOLS.TASKS.CUSTOM_FIELDS.ACCESS,
  PermissionCodes.TOOLS.TASKS.CUSTOM_FIELDS.REGISTER,
  PermissionCodes.TOOLS.TASKS.CUSTOM_FIELDS.MODIFY,
  PermissionCodes.TOOLS.TASKS.CUSTOM_FIELDS.REMOVE,

  // tools.calendar — gerenciar próprios eventos
  PermissionCodes.TOOLS.CALENDAR.ACCESS,
  PermissionCodes.TOOLS.CALENDAR.REGISTER,
  PermissionCodes.TOOLS.CALENDAR.MODIFY,
  PermissionCodes.TOOLS.CALENDAR.REMOVE,
  PermissionCodes.TOOLS.CALENDAR.ONLYSELF,

  // tools.storage.folders — navegação
  PermissionCodes.TOOLS.STORAGE.FOLDERS.ACCESS,

  // tools.storage.files — gerenciar próprios arquivos
  PermissionCodes.TOOLS.STORAGE.FILES.ACCESS,
  PermissionCodes.TOOLS.STORAGE.FILES.REGISTER,
  PermissionCodes.TOOLS.STORAGE.FILES.MODIFY,
  PermissionCodes.TOOLS.STORAGE.FILES.REMOVE,
  PermissionCodes.TOOLS.STORAGE.FILES.ONLYSELF,

  // tools.ai — acesso ao assistente IA
  PermissionCodes.TOOLS.AI.CHAT.ACCESS,
  PermissionCodes.TOOLS.AI.INSIGHTS.ACCESS,
  PermissionCodes.TOOLS.AI.FAVORITES.ACCESS,
  PermissionCodes.TOOLS.AI.FAVORITES.REGISTER,
  PermissionCodes.TOOLS.AI.FAVORITES.REMOVE,
  PermissionCodes.TOOLS.AI.ACTIONS.ACCESS,

  // tools.notifications — central + preferências do usuário
  PermissionCodes.TOOLS.NOTIFICATIONS.ACCESS,
  PermissionCodes.TOOLS.NOTIFICATIONS.PREFERENCES.ACCESS,
  PermissionCodes.TOOLS.NOTIFICATIONS.PREFERENCES.MODIFY,
  PermissionCodes.TOOLS.NOTIFICATIONS.DEVICES.ADMIN,

  // sales — CRM básico (visualização + atividades próprias)
  PermissionCodes.SALES.CUSTOMERS.ACCESS,
  PermissionCodes.SALES.CONTACTS.ACCESS,
  PermissionCodes.SALES.DEALS.ACCESS,
  PermissionCodes.SALES.DEALS.ONLYSELF,
  PermissionCodes.SALES.ACTIVITIES.ACCESS,
  PermissionCodes.SALES.ACTIVITIES.REGISTER,
  PermissionCodes.SALES.CONVERSATIONS.ACCESS,
  PermissionCodes.SALES.CONVERSATIONS.REPLY,
  PermissionCodes.SALES.ANALYTICS.ACCESS,
  PermissionCodes.SALES.ANALYTICS.ONLYSELF,

  // hr.punch-approvals — funcionário vê próprias aprovações pendentes
  // (Plan 04-02 AD-05; o endpoint list filtra por employeeId do chamador)
  PermissionCodes.HR.PUNCH_APPROVALS.ACCESS,
];

// =============================================================================
// DEFAULT_ACCOUNTANT_PERMISSIONS — read-only Finance + exportações contábeis
// =============================================================================
export const DEFAULT_ACCOUNTANT_PERMISSIONS: string[] = [
  // self (básico)
  PermissionCodes.SYSTEM.SELF.ACCESS,
  PermissionCodes.SYSTEM.SELF.MODIFY,

  // finance — leitura completa (sem REGISTER/MODIFY/REMOVE)
  PermissionCodes.FINANCE.CHART_OF_ACCOUNTS.ACCESS,
  PermissionCodes.FINANCE.CATEGORIES.ACCESS,
  PermissionCodes.FINANCE.COST_CENTERS.ACCESS,
  PermissionCodes.FINANCE.BANK_ACCOUNTS.ACCESS,
  PermissionCodes.FINANCE.SUPPLIERS.ACCESS,
  PermissionCodes.FINANCE.CONTRACTS.ACCESS,
  PermissionCodes.FINANCE.ENTRIES.ACCESS,
  PermissionCodes.FINANCE.ENTRIES.EXPORT,
  PermissionCodes.FINANCE.ENTRIES.PRINT,
  PermissionCodes.FINANCE.CONSORTIA.ACCESS,
  PermissionCodes.FINANCE.LOANS.ACCESS,
  PermissionCodes.FINANCE.RECURRING.ACCESS,
  PermissionCodes.FINANCE.REPORTS.ACCESS,
  PermissionCodes.FINANCE.REPORTS.EXPORT,
  PermissionCodes.FINANCE.PERIOD_LOCKS.ACCESS,
  PermissionCodes.FINANCE.ACCOUNTANT.ACCESS,
  PermissionCodes.FINANCE.SUPPLIERS.EXPORT,
  PermissionCodes.FINANCE.CONTRACTS.EXPORT,
];

// =============================================================================
// isValidPermissionCode — Validação de formato
// =============================================================================
export function isValidPermissionCode(code: string): boolean {
  const parts = code.split('.');
  return parts.length >= 3 && parts.length <= 4;
}

// =============================================================================
// parsePermissionCode — Decomposição de código em module/resource/action
// =============================================================================

export interface ParsedPermissionCode {
  module: string;
  resource: string;
  action: string;
}

/**
 * Decompõe um código de permissão em suas partes constituintes.
 *
 * - 3 níveis: `stock.products.access` → `{ module: 'stock', resource: 'products', action: 'access' }`
 * - 4 níveis: `tools.email.accounts.access` → `{ module: 'tools', resource: 'email.accounts', action: 'access' }`
 *
 * O sub-recurso é absorvido pelo campo `resource` (Option B),
 * mantendo `action` sempre como um verbo único.
 *
 * @throws Error se o código não tiver 3 ou 4 partes
 */
export function parsePermissionCode(code: string): ParsedPermissionCode {
  const parts = code.split('.');

  if (parts.length === 3) {
    return { module: parts[0], resource: parts[1], action: parts[2] };
  }

  if (parts.length === 4) {
    return {
      module: parts[0],
      resource: `${parts[1]}.${parts[2]}`,
      action: parts[3],
    };
  }

  throw new Error(
    `Invalid permission code: '${code}'. Expected 3 or 4 dot-separated parts.`,
  );
}
