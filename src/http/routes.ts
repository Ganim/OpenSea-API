import type { FastifyInstance } from 'fastify';

// Core routes
import { authRoutes } from './controllers/core/auth/routes';
import { labelTemplatesRoutes } from './controllers/core/label-templates/routes';
import { meRoutes } from './controllers/core/me/routes';
import { sessionsRoutes } from './controllers/core/sessions/routes';
import { tenantsRoutes } from './controllers/core/tenants/routes';
import { usersRoutes } from './controllers/core/users/routes';
import { healthRoutes } from './controllers/health/routes';

// Admin routes
import { adminRoutes } from './controllers/admin/routes';

// RBAC routes
import { associationsRoutes } from './controllers/rbac/associations/routes';
import { permissionGroupsRoutes } from './controllers/rbac/permission-groups/routes';
import { permissionsRoutes } from './controllers/rbac/permissions/routes';
import { userDirectPermissionsRoutes } from './controllers/rbac/user-direct-permissions/routes';

// Sales routes
import { commentsRoutes } from './controllers/sales/comments/routes';
import { customersRoutes } from './controllers/sales/customers/routes';
import { itemReservationsRoutes } from './controllers/sales/item-reservations/routes';
import { notificationPreferencesRoutes } from './controllers/sales/notification-preferences/routes';
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
import { categoriesRoutes } from './controllers/stock/categories/routes';
import { itemMovementsRoutes } from './controllers/stock/item-movements/routes';
import { itemsRoutes } from './controllers/stock/items/routes';
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
import { warehousesRoutes } from './controllers/stock/warehouses/routes';
import { zonesRoutes } from './controllers/stock/zones/routes';

// Finance routes
import { bankAccountsRoutes } from './controllers/finance/bank-accounts/routes';
import { financeCategoriesRoutes } from './controllers/finance/categories/routes';
import { costCentersRoutes } from './controllers/finance/cost-centers/routes';
import { financeEntriesRoutes } from './controllers/finance/entries/routes';
import { financeAttachmentsRoutes } from './controllers/finance/attachments/routes';
import { financeDashboardRoutes } from './controllers/finance/dashboard/routes';
import { loansRoutes } from './controllers/finance/loans/routes';
import { consortiaRoutes } from './controllers/finance/consortia/routes';

// HR routes
import { absencesRoutes } from './controllers/hr/absences/routes';
import { bonusesRoutes } from './controllers/hr/bonuses/routes';
import { companiesRoutes } from './controllers/hr/companies/routes';
import { companyAddressesRoutes } from './controllers/hr/company-addresses/routes';
import { companyCnaesRoutes } from './controllers/hr/company-cnaes/routes';
import { companyFiscalSettingsRoutes } from './controllers/hr/company-fiscal-settings/routes';
import { companyStakeholderRoutes } from './controllers/hr/company-stakeholder/routes';
import { deductionsRoutes } from './controllers/hr/deductions/routes';
import { departmentsRoutes } from './controllers/hr/departments/routes';
import { employeesRoutes } from './controllers/hr/employees/routes';
import { manufacturersRoutes as hrManufacturersRoutes } from './controllers/hr/manufacturers/routes';
import { overtimeRoutes } from './controllers/hr/overtime/routes';
import { payrollsRoutes } from './controllers/hr/payrolls/routes';
import { positionsRoutes } from './controllers/hr/positions/routes';
import { suppliersRoutes as hrSuppliersRoutes } from './controllers/hr/suppliers/routes';
import { timeBankRoutes } from './controllers/hr/time-bank/routes';
import { timeControlRoutes } from './controllers/hr/time-control/routes';
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

  // Admin routes
  await app.register(adminRoutes);

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
  await app.register(warehousesRoutes);
  await app.register(zonesRoutes);
  await app.register(binsRoutes);
  await app.register(volumesRoutes);
  await app.register(labelsRoutes);
  await app.register(addressRoutes);
  await app.register(tagsRoutes);
  await app.register(templatesRoutes);
  await app.register(itemsRoutes);
  await app.register(itemMovementsRoutes);
  await app.register(purchaseOrdersRoutes);
  await app.register(careRoutes);

  // Sales routes
  await app.register(customersRoutes);
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

  // HR routes
  await app.register(employeesRoutes);
  await app.register(departmentsRoutes);
  await app.register(companiesRoutes);
  await app.register(hrSuppliersRoutes);
  await app.register(hrManufacturersRoutes);
  await app.register(positionsRoutes);
  await app.register(timeControlRoutes);
  await app.register(workSchedulesRoutes);
  await app.register(overtimeRoutes);
  await app.register(timeBankRoutes);
  await app.register(absencesRoutes);
  await app.register(vacationPeriodsRoutes);
  await app.register(payrollsRoutes);
  await app.register(bonusesRoutes);
  await app.register(deductionsRoutes);
  await app.register(companyAddressesRoutes);
  await app.register(companyCnaesRoutes);
  await app.register(companyFiscalSettingsRoutes);
  await app.register(companyStakeholderRoutes);

  // Audit routes
  await app.register(auditRoutes);
}
