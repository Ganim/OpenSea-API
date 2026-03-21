import type { FastifyInstance } from 'fastify';

// Core routes
import { authRoutes } from './controllers/core/auth/routes';
import { labelTemplatesRoutes } from './controllers/core/label-templates/routes';
import { meRoutes } from './controllers/core/me/routes';
import { sessionsRoutes } from './controllers/core/sessions/routes';
import { teamsRoutes } from './controllers/core/teams/routes';
import { tenantsRoutes } from './controllers/core/tenants/routes';
import { usersRoutes } from './controllers/core/users/routes';
import { healthRoutes } from './controllers/health/routes';

// Admin routes
import { adminRoutes } from './controllers/admin/routes';
import { adminCompaniesRoutes } from './controllers/admin/companies/routes';

// RBAC routes
import { associationsRoutes } from './controllers/rbac/associations/routes';
import { permissionGroupsRoutes } from './controllers/rbac/permission-groups/routes';
import { permissionsRoutes } from './controllers/rbac/permissions/routes';
import { userDirectPermissionsRoutes } from './controllers/rbac/user-direct-permissions/routes';

// Sales routes
import { commentsRoutes } from './controllers/sales/comments/routes';
import { contactsRoutes } from './controllers/sales/contacts/routes';
import { customersRoutes } from './controllers/sales/customers/routes';
import { itemReservationsRoutes } from './controllers/sales/item-reservations/routes';
import { notificationPreferencesRoutes } from './controllers/sales/notification-preferences/routes';
import { pipelineStagesRoutes } from './controllers/sales/pipeline-stages/routes';
import { pipelinesRoutes } from './controllers/sales/pipelines/routes';
import { salesOrdersRoutes } from './controllers/sales/sales-orders/routes';
import { variantPromotionsRoutes } from './controllers/sales/variant-promotions/routes';
// Notifications (Workflow)
import { notificationsRoutes } from './controllers/notifications/routes';

// Requests (Workflow)
import { requestsRoutes } from './controllers/requests/routes';

// Audit routes
import { auditRoutes } from './controllers/audit/routes';

// Stock routes
import { careRoutes } from './controllers/stock/care/routes';
import { productCareInstructionsRoutes } from './controllers/stock/product-care-instructions/routes';
import { productAttachmentRoutes } from './controllers/stock/product-attachments/routes';
import { variantAttachmentRoutes } from './controllers/stock/variant-attachments/routes';
import { categoriesRoutes } from './controllers/stock/categories/routes';
import { itemMovementsRoutes } from './controllers/stock/item-movements/routes';
import { itemsRoutes } from './controllers/stock/items/routes';
import { lookupRoutes } from './controllers/stock/lookup/routes';
// Location routes replaced by new Warehouse/Zone/Bin system
import { addressRoutes } from './controllers/stock/address/routes';
import { binsRoutes } from './controllers/stock/bins/routes';
import { labelsRoutes } from './controllers/stock/labels/routes';
import { manufacturersRoutes } from './controllers/stock/manufacturers/routes';
import { productsRoutes } from './controllers/stock/products/routes';
import { purchaseOrdersRoutes } from './controllers/stock/purchase-orders/routes';
import { suppliersRoutes } from './controllers/stock/suppliers/routes';
import { tagsRoutes } from './controllers/stock/tags/routes';
import { templatesRoutes } from './controllers/stock/templates/routes';
import { variantsRoutes } from './controllers/stock/variants/routes';
import { volumesRoutes } from './controllers/stock/volumes/routes';
import { locationsRoutes } from './controllers/stock/locations/routes';
import { warehousesRoutes } from './controllers/stock/warehouses/routes';
import { zonesRoutes } from './controllers/stock/zones/routes';

// Storage routes
import { storageAccessRoutes } from './controllers/storage/access/routes';
import { storageAdminRoutes } from './controllers/storage/admin/routes';
import { storageFilesRoutes } from './controllers/storage/files/routes';
import { storageFoldersRoutes } from './controllers/storage/folders/routes';
import { storagePublicRoutes } from './controllers/storage/public/routes';
import { storageSharingRoutes } from './controllers/storage/sharing/routes';
import { storageSecurityRoutes } from './controllers/storage/security/routes';
import { storageTrashRoutes } from './controllers/storage/trash/routes';

// Finance routes
import { financeAttachmentsRoutes } from './controllers/finance/attachments/routes';
import { bankAccountsRoutes } from './controllers/finance/bank-accounts/routes';
import { financeCategoriesRoutes } from './controllers/finance/categories/routes';
import { consortiaRoutes } from './controllers/finance/consortia/routes';
import { costCentersRoutes } from './controllers/finance/cost-centers/routes';
import { financeDashboardRoutes } from './controllers/finance/dashboard/routes';
import { financeEntriesRoutes } from './controllers/finance/entries/routes';
import { financeExportRoutes } from './controllers/finance/export/routes';
import { loansRoutes } from './controllers/finance/loans/routes';
import { contractsRoutes } from './controllers/finance/contracts/routes';
import { financeRecurringRoutes } from './controllers/finance/recurring/routes';
import { financeCompaniesRoutes } from './controllers/finance/companies/routes';

// Calendar routes
import { calendarCalendarsRoutes } from './controllers/calendar/calendars/routes';
import { calendarEventsRoutes } from './controllers/calendar/events/routes';

// Email routes
import { emailAccountsRoutes } from './controllers/email/accounts/routes';
import { emailFoldersRoutes } from './controllers/email/folders/routes';
import { emailMessagesRoutes } from './controllers/email/messages/routes';

// Tasks routes
import { taskActivityRoutes } from './controllers/tasks/activity/routes';
import { taskAttachmentsRoutes } from './controllers/tasks/attachments/routes';
import { taskAutomationsRoutes } from './controllers/tasks/automations/routes';
import { taskBoardsRoutes } from './controllers/tasks/boards/routes';
import { taskCardsRoutes } from './controllers/tasks/cards/routes';
import { taskChecklistsRoutes } from './controllers/tasks/checklists/routes';
import { taskColumnsRoutes } from './controllers/tasks/columns/routes';
import { taskCommentsRoutes } from './controllers/tasks/comments/routes';
import { taskCustomFieldsRoutes } from './controllers/tasks/custom-fields/routes';
import { taskLabelsRoutes } from './controllers/tasks/labels/routes';
import { taskSubtasksRoutes } from './controllers/tasks/subtasks/routes';
import { taskWatchersRoutes } from './controllers/tasks/watchers/routes';

// HR routes
import { absencesRoutes } from './controllers/hr/absences/routes';
import { bonusesRoutes } from './controllers/hr/bonuses/routes';
import { companiesRoutes } from './controllers/hr/companies/routes';
import { deductionsRoutes } from './controllers/hr/deductions/routes';
import { departmentsRoutes } from './controllers/hr/departments/routes';
import { employeesRoutes } from './controllers/hr/employees/routes';
import { overtimeRoutes } from './controllers/hr/overtime/routes';
import { payrollsRoutes } from './controllers/hr/payrolls/routes';
import { positionsRoutes } from './controllers/hr/positions/routes';
import { timeBankRoutes } from './controllers/hr/time-bank/routes';
import { timeControlRoutes } from './controllers/hr/time-control/routes';
import { hrReportsRoutes } from './controllers/hr/reports/routes';
import { vacationPeriodsRoutes } from './controllers/hr/vacation-periods/routes';
import { workSchedulesRoutes } from './controllers/hr/work-schedules/routes';

export async function registerRoutes(app: FastifyInstance) {
  // Core routes
  await app.register(healthRoutes);
  await app.register(meRoutes);
  await app.register(authRoutes);
  await app.register(usersRoutes);
  await app.register(sessionsRoutes);
  await app.register(labelTemplatesRoutes);
  await app.register(tenantsRoutes);
  await app.register(teamsRoutes);

  // Admin routes (super-admin)
  await app.register(adminRoutes);
  // Admin routes (tenant-scoped)
  await app.register(adminCompaniesRoutes);

  // RBAC routes
  await app.register(permissionsRoutes);
  await app.register(permissionGroupsRoutes);
  await app.register(associationsRoutes);
  await app.register(userDirectPermissionsRoutes);

  // Stock routes
  await app.register(productsRoutes);
  await app.register(variantsRoutes);
  await app.register(categoriesRoutes);
  await app.register(manufacturersRoutes);
  await app.register(suppliersRoutes);
  await app.register(locationsRoutes);
  await app.register(warehousesRoutes);
  await app.register(zonesRoutes);
  await app.register(binsRoutes);
  await app.register(volumesRoutes);
  await app.register(labelsRoutes);
  await app.register(addressRoutes);
  await app.register(tagsRoutes);
  await app.register(templatesRoutes);
  await app.register(itemsRoutes);
  await app.register(lookupRoutes);
  await app.register(itemMovementsRoutes);
  await app.register(purchaseOrdersRoutes);
  await app.register(careRoutes);
  await app.register(productCareInstructionsRoutes);
  await app.register(productAttachmentRoutes);
  await app.register(variantAttachmentRoutes);

  // Sales routes
  await app.register(customersRoutes);
  await app.register(contactsRoutes);
  await app.register(pipelinesRoutes);
  await app.register(pipelineStagesRoutes);
  await app.register(salesOrdersRoutes);
  await app.register(commentsRoutes);
  await app.register(variantPromotionsRoutes);
  await app.register(itemReservationsRoutes);
  await app.register(notificationPreferencesRoutes);
  await app.register(notificationsRoutes);

  // Requests routes (Workflow)
  await app.register(requestsRoutes);

  // Finance routes
  await app.register(costCentersRoutes);
  await app.register(bankAccountsRoutes);
  await app.register(financeCategoriesRoutes);
  await app.register(financeEntriesRoutes);
  await app.register(financeAttachmentsRoutes);
  await app.register(financeDashboardRoutes);
  await app.register(loansRoutes);
  await app.register(consortiaRoutes);
  await app.register(financeExportRoutes);
  await app.register(contractsRoutes);
  await app.register(financeRecurringRoutes);
  await app.register(financeCompaniesRoutes);

  // Calendar routes
  await app.register(calendarCalendarsRoutes);
  await app.register(calendarEventsRoutes);

  // Email routes
  await app.register(emailAccountsRoutes);
  await app.register(emailFoldersRoutes);
  await app.register(emailMessagesRoutes);

  // Storage routes
  await app.register(storageFoldersRoutes);
  await app.register(storageFilesRoutes);
  await app.register(storageAccessRoutes);
  await app.register(storageTrashRoutes);
  await app.register(storageSharingRoutes);
  await app.register(storageSecurityRoutes);
  await app.register(storagePublicRoutes);
  await app.register(storageAdminRoutes);

  // HR routes
  await app.register(employeesRoutes);
  await app.register(departmentsRoutes);
  await app.register(companiesRoutes);
  await app.register(positionsRoutes);
  await app.register(timeControlRoutes);
  await app.register(workSchedulesRoutes);
  await app.register(overtimeRoutes);
  await app.register(timeBankRoutes);
  await app.register(absencesRoutes);
  await app.register(vacationPeriodsRoutes);
  await app.register(hrReportsRoutes);
  await app.register(payrollsRoutes);
  await app.register(bonusesRoutes);
  await app.register(deductionsRoutes);

  // Tasks routes
  await app.register(taskBoardsRoutes);
  await app.register(taskColumnsRoutes);
  await app.register(taskCardsRoutes);
  await app.register(taskSubtasksRoutes);
  await app.register(taskChecklistsRoutes);
  await app.register(taskCommentsRoutes);
  await app.register(taskAttachmentsRoutes);
  await app.register(taskLabelsRoutes);
  await app.register(taskCustomFieldsRoutes);
  await app.register(taskAutomationsRoutes);
  await app.register(taskActivityRoutes);
  await app.register(taskWatchersRoutes);

  // Audit routes
  await app.register(auditRoutes);
}
