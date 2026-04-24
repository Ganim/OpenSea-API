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
import { adminBillingRoutes } from './controllers/admin/billing/routes';
import { adminCatalogRoutes } from './controllers/admin/catalog/routes';
import { adminCompaniesRoutes } from './controllers/admin/companies/routes';
import { adminMonitoringRoutes } from './controllers/admin/monitoring/routes';
import { adminRoutes } from './controllers/admin/routes';
import { adminSupportRoutes } from './controllers/admin/support/routes';
import { adminTeamRoutes } from './controllers/admin/team/routes';
import { adminTenantSubscriptionsRoutes } from './controllers/admin/tenants/routes';

// Tenant Support routes
import { tenantSupportRoutes } from './controllers/tenant-support/routes';

// RBAC routes
import { associationsRoutes } from './controllers/rbac/associations/routes';
import { permissionGroupsRoutes } from './controllers/rbac/permission-groups/routes';
import { permissionsRoutes } from './controllers/rbac/permissions/routes';
import { userDirectPermissionsRoutes } from './controllers/rbac/user-direct-permissions/routes';

// Sales routes
import { activitiesRoutes } from './controllers/sales/activities/routes';
import { bidsRoutes } from './controllers/sales/bids/routes';
import { blueprintsRoutes } from './controllers/sales/blueprints/routes';
import { brandRoutes } from './controllers/sales/brand/routes';
import { campaignsRoutes } from './controllers/sales/campaigns/routes';
import { catalogsRoutes } from './controllers/sales/catalogs/routes';
import { combosRoutes } from './controllers/sales/combos/routes';
import { commentsRoutes } from './controllers/sales/comments/routes';
import { contactsRoutes } from './controllers/sales/contacts/routes';
import { contentRoutes } from './controllers/sales/content/routes';
import { couponsRoutes } from './controllers/sales/coupons/routes';
import { customerPricesRoutes } from './controllers/sales/customer-prices/routes';
import { customersRoutes } from './controllers/sales/customers/routes';
import { dealsRoutes } from './controllers/sales/deals/routes';
import { integrationsHubRoutes } from './controllers/sales/integrations/routes';
import { invoicingRoutes } from './controllers/sales/invoicing/routes';
import { itemReservationsRoutes } from './controllers/sales/item-reservations/routes';
import { marketplacesRoutes } from './controllers/sales/marketplaces/routes';
import { notificationPreferencesRoutes } from './controllers/sales/notification-preferences/routes';
import { orderReturnsRoutes } from './controllers/sales/order-returns/routes';
import { ordersRoutes } from './controllers/sales/orders/routes';
import { paymentChargesRoutes } from './controllers/sales/payment-charges/routes';
import { paymentConditionsRoutes } from './controllers/sales/payment-conditions/routes';
import { paymentConfigRoutes } from './controllers/sales/payment-config/routes';
import { pipelineStagesRoutes } from './controllers/sales/pipeline-stages/routes';
import { pipelinesRoutes } from './controllers/sales/pipelines/routes';
import { posRoutes } from './controllers/sales/pos/routes';
import { priceTablesRoutes } from './controllers/sales/price-tables/routes';
import {
  printAgentsRoutes,
  printAgentsPublicRoutes,
} from './controllers/sales/print-agents/routes';
import { printersRoutes } from './controllers/sales/printers/routes';
import {
  printAgentWsRoutes,
  printingRoutes,
} from './controllers/sales/printing/routes';
import { salesOrdersRoutes } from './controllers/sales/sales-orders/routes';
import { storeCreditsRoutes } from './controllers/sales/store-credits/routes';
import { timelineRoutes } from './controllers/sales/timeline/routes';
import { variantPromotionsRoutes } from './controllers/sales/variant-promotions/routes';
// Sales - Planned (placeholder stubs)
import { bidBotRoutes } from './controllers/sales/bid-bot/routes';
import { cadencesRoutes } from './controllers/sales/cadences/routes';
import { salesCashierRoutes } from './controllers/sales/cashier/routes';
import { chatbotRoutes } from './controllers/sales/chatbot/routes';
import { commissionsRoutes } from './controllers/sales/commissions/routes';
import { conversationsRoutes } from './controllers/sales/conversations/routes';
import { discountsRoutes } from './controllers/sales/discounts/routes';
import { formsRoutes } from './controllers/sales/forms/routes';
import { landingPagesRoutes } from './controllers/sales/landing-pages/routes';
import { leadRoutingRoutes } from './controllers/sales/lead-routing/routes';
import { leadScoringRoutes } from './controllers/sales/lead-scoring/routes';
import { msgTemplatesRoutes } from './controllers/sales/msg-templates/routes';
import { predictionsRoutes } from './controllers/sales/predictions/routes';
import { proposalsRoutes } from './controllers/sales/proposals/routes';
import { quotesRoutes } from './controllers/sales/quotes/routes';
import { sentimentRoutes } from './controllers/sales/sentiment/routes';
import { salesSignaturesRoutes } from './controllers/sales/signatures/routes';
import { salesTrackingRoutes } from './controllers/sales/tracking/routes';
import { workflowsRoutes } from './controllers/sales/workflows/routes';
// Sales - Analytics
import { analyticsCustomerPortalRoutes } from './controllers/sales/analytics/customer-portal/routes';
import { analyticsDashboardsRoutes } from './controllers/sales/analytics/dashboards/routes';
import { analyticsGoalsRoutes } from './controllers/sales/analytics/goals/routes';
import { analyticsRankingsRoutes } from './controllers/sales/analytics/rankings/routes';
import { analyticsReportsRoutes } from './controllers/sales/analytics/reports/routes';
// Notifications (Workflow)
import { notificationsRoutes } from './controllers/notifications/routes';
import { notificationsV2Routes } from '@/modules/notifications/http/routes';
import { notificationsUnsubscribeRoutes } from '@/modules/notifications/http/unsubscribe.routes';
import { notificationsAdminHealthRoutes } from '@/modules/notifications/http/admin-health.routes';

// Requests (Workflow)
import { requestsRoutes } from './controllers/requests/routes';

// Cashier routes
import { cashierRoutes } from './controllers/cashier/routes';

// Audit routes
import { auditRoutes } from './controllers/audit/routes';

// Stock routes
import { careRoutes } from './controllers/stock/care/routes';
import { categoriesRoutes } from './controllers/stock/categories/routes';
import { inventorySessionsRoutes } from './controllers/stock/inventory-sessions/routes';
import { itemMovementsRoutes } from './controllers/stock/item-movements/routes';
import { itemsRoutes } from './controllers/stock/items/routes';
import { lookupRoutes } from './controllers/stock/lookup/routes';
import { productAttachmentRoutes } from './controllers/stock/product-attachments/routes';
import { productCareInstructionsRoutes } from './controllers/stock/product-care-instructions/routes';
import { variantAttachmentRoutes } from './controllers/stock/variant-attachments/routes';
// Location routes replaced by new Warehouse/Zone/Bin system
import { addressRoutes } from './controllers/stock/address/routes';
import { binsRoutes } from './controllers/stock/bins/routes';
import { labelsRoutes } from './controllers/stock/labels/routes';
import { locationsRoutes } from './controllers/stock/locations/routes';
import { manufacturersRoutes } from './controllers/stock/manufacturers/routes';
import { productsRoutes } from './controllers/stock/products/routes';
import { purchaseOrdersRoutes } from './controllers/stock/purchase-orders/routes';
import { tagsRoutes } from './controllers/stock/tags/routes';
import { templatesRoutes } from './controllers/stock/templates/routes';
import { variantsRoutes } from './controllers/stock/variants/routes';
import { volumesRoutes } from './controllers/stock/volumes/routes';
import { warehousesRoutes } from './controllers/stock/warehouses/routes';
import { zonesRoutes } from './controllers/stock/zones/routes';

// Storage routes
import { storageAccessRoutes } from './controllers/storage/access/routes';
import { storageAdminRoutes } from './controllers/storage/admin/routes';
import { storageFilesRoutes } from './controllers/storage/files/routes';
import { storageFoldersRoutes } from './controllers/storage/folders/routes';
import { storagePublicRoutes } from './controllers/storage/public/routes';
import { storageSecurityRoutes } from './controllers/storage/security/routes';
import { storageSharingRoutes } from './controllers/storage/sharing/routes';
import { storageTrashRoutes } from './controllers/storage/trash/routes';

// Finance routes
import { financeAccountantRoutes } from './controllers/finance/accountant/routes';
import { financeApprovalRulesRoutes } from './controllers/finance/approval-rules/routes';
import { financeAttachmentsRoutes } from './controllers/finance/attachments/routes';
import { bankAccountsRoutes } from './controllers/finance/bank-accounts/routes';
import { bankConnectionsRoutes } from './controllers/finance/bank-connections/routes';
import { boletoRoutes } from './controllers/finance/boleto/routes';
import { financeBudgetRoutes } from './controllers/finance/budgets/routes';
import { financeCategoriesRoutes } from './controllers/finance/categories/routes';
import { chartOfAccountsRoutes } from './controllers/finance/chart-of-accounts/routes';
import { financeCompaniesRoutes } from './controllers/finance/companies/routes';
import { financeComplianceRoutes } from './controllers/finance/compliance/routes';
import { consortiaRoutes } from './controllers/finance/consortia/routes';
import { contractsRoutes } from './controllers/finance/contracts/routes';
import { costCentersRoutes } from './controllers/finance/cost-centers/routes';
import { financeCustomerPortalRoutes } from './controllers/finance/customer-portal/routes';
import { financeDashboardRoutes } from './controllers/finance/dashboard/routes';
import { financeEntriesRoutes } from './controllers/finance/entries/routes';
import { financeEscalationsRoutes } from './controllers/finance/escalations/routes';
import { financeExchangeRatesRoutes } from './controllers/finance/exchange-rates/routes';
import { financeExportRoutes } from './controllers/finance/export/routes';
import { journalEntriesRoutes } from './controllers/finance/journal-entries/routes';
import { loansRoutes } from './controllers/finance/loans/routes';
import { paymentLinksRoutes } from './controllers/finance/payment-links/routes';
import { paymentOrdersRoutes } from './controllers/finance/payment-orders/routes';
import { pixRoutes } from './controllers/finance/pix/routes';
import { financePeriodLockRoutes } from './controllers/finance/period-locks/routes';
import { reconciliationRoutes } from './controllers/finance/reconciliation/routes';
import { financeRecurringRoutes } from './controllers/finance/recurring/routes';
import { financeReportsRoutes } from './controllers/finance/reports/routes';
import { bankWebhookRoutes } from './controllers/finance/webhooks/routes';

// Accountant Portal routes (token-based auth)
import { accountantPortalRoutes } from './controllers/accountant/routes';

// Payment webhook routes (public — no auth)
import { paymentWebhookRoutes } from './controllers/webhooks/routes';

// Public routes (no auth)
import { publicRoutes, publicPunchRoutes } from './controllers/public/routes';

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
import { taskIntegrationsRoutes } from './controllers/tasks/integrations/routes';
import { taskLabelsRoutes } from './controllers/tasks/labels/routes';
import { taskMembersRoutes } from './controllers/tasks/members/routes';
import { taskSubtasksRoutes } from './controllers/tasks/subtasks/routes';
import { taskWatchersRoutes } from './controllers/tasks/watchers/routes';

// Messaging routes
import { messagingRoutes } from './controllers/messaging/routes';

// Signature routes
import { signatureCertificatesRoutes } from './controllers/tools/signature/certificates/routes';
import { signatureEnvelopesRoutes } from './controllers/tools/signature/envelopes/routes';
import { signaturePublicRoutes } from './controllers/tools/signature/public/routes';
import { signatureSigningRoutes } from './controllers/tools/signature/signing/routes';
import { signatureTemplatesRoutes } from './controllers/tools/signature/templates/routes';

// AI Assistant routes
import { aiActionLogsRoutes } from './controllers/ai/actions/routes';
import { aiCampaignsRoutes } from './controllers/ai/campaigns/routes';
import { aiChatRoutes } from './controllers/ai/chat/routes';
import { aiConfigRoutes } from './controllers/ai/config/routes';
import { aiContentRoutes } from './controllers/ai/content/routes';
import { aiDocumentsRoutes } from './controllers/ai/documents/routes';
import { aiFavoritesRoutes } from './controllers/ai/favorites/routes';
import { aiFinanceRoutes } from './controllers/ai/finance/routes';
import { aiInsightsRoutes } from './controllers/ai/insights/routes';
import { aiSetupWizardRoutes } from './controllers/ai/setup-wizard/routes';
import { aiWorkflowsRoutes } from './controllers/ai/workflows/routes';

// eSocial routes
import { esocialCertificatesRoutes } from './controllers/esocial/certificates/routes';
import { esocialConfigRoutes } from './controllers/esocial/config/routes';
import { esocialRubricasRoutes } from './controllers/esocial/rubricas/routes';
import { esocialTablesRoutes } from './controllers/esocial/tables/routes';

// Production routes
import { bomItemsRoutes } from './controllers/production/bom-items/routes';
import { bomsRoutes } from './controllers/production/boms/routes';
import { defectTypesRoutes } from './controllers/production/defect-types/routes';
import { downtimeReasonsRoutes } from './controllers/production/downtime-reasons/routes';
import { operationRoutingsRoutes } from './controllers/production/operation-routings/routes';
import { productionOrdersRoutes } from './controllers/production/production-orders/routes';
import { workCentersRoutes } from './controllers/production/work-centers/routes';
import { workstationTypesRoutes } from './controllers/production/workstation-types/routes';
import { downtimeRecordsRoutes } from './controllers/production/downtime-records/routes';
import { jobCardsRoutes } from './controllers/production/job-cards/routes';
import { workstationsRoutes } from './controllers/production/workstations/routes';
import { inspectionPlansRoutes } from './controllers/production/inspection-plans/routes';
import { qualityHoldsRoutes } from './controllers/production/quality-holds/routes';
import { productionSchedulesRoutes } from './controllers/production/schedules/routes';
import { productionCostingRoutes } from './controllers/production/costing/routes';
import { productionAnalyticsRoutes } from './controllers/production/analytics/routes';
import { textileRoutes } from './controllers/production/textile/routes';
import { timeEntriesRoutes } from './controllers/production/time-entries/routes';
import { productionEntriesRoutes } from './controllers/production/production-entries/routes';
import { inspectionResultsRoutes } from './controllers/production/inspection-results/routes';
import { defectRecordsRoutes } from './controllers/production/defect-records/routes';
import { materialReservationsRoutes } from './controllers/production/material-reservations/routes';
import { materialIssuesRoutes } from './controllers/production/material-issues/routes';
import { materialReturnsRoutes } from './controllers/production/material-returns/routes';

// Fiscal routes
import { fiscalRoutes } from './controllers/fiscal/routes';

// HR routes
import { absencesRoutes } from './controllers/hr/absences/routes';
import { admissionsRoutes } from './controllers/hr/admissions/routes';
import { hrAnalyticsRoutes } from './controllers/hr/analytics/routes';
import { hrAnnouncementsRoutes } from './controllers/hr/announcements/routes';
import { approvalDelegationsRoutes } from './controllers/hr/approval-delegations/routes';
import { benefitDeductionsRoutes } from './controllers/hr/benefit-deductions/routes';
import { benefitEnrollmentsRoutes } from './controllers/hr/benefit-enrollments/routes';
import { benefitPlansRoutes } from './controllers/hr/benefit-plans/routes';
import { bonusesRoutes } from './controllers/hr/bonuses/routes';
import { cipaMandatesRoutes } from './controllers/hr/cipa-mandates/routes';
import { cipaMembersRoutes } from './controllers/hr/cipa-members/routes';
import { companiesRoutes } from './controllers/hr/companies/routes';
import { contractsRoutes as hrContractsRoutes } from './controllers/hr/contracts/routes';
import { deductionsRoutes } from './controllers/hr/deductions/routes';
import { departmentsRoutes } from './controllers/hr/departments/routes';
import { dependantsRoutes } from './controllers/hr/dependants/routes';
import { employeeRequestsRoutes } from './controllers/hr/employee-requests/routes';
import { employeesRoutes } from './controllers/hr/employees/routes';
import { esocialRoutes } from './controllers/hr/esocial/routes';
import { examRequirementsRoutes } from './controllers/hr/exam-requirements/routes';
import { flexBenefitsRoutes } from './controllers/hr/flex-benefits/routes';
import { geofenceZonesRoutes } from './controllers/hr/geofence-zones/routes';
import { hrConfigRoutes } from './controllers/hr/hr-config/routes';
import { kudosRoutes } from './controllers/hr/kudos/routes';
import { medicalExamsRoutes } from './controllers/hr/medical-exams/routes';
import { offboardingRoutes } from './controllers/hr/offboarding/routes';
import { okrsRoutes } from './controllers/hr/okrs/routes';
import { onboardingRoutes } from './controllers/hr/onboarding/routes';
import { overtimeRoutes } from './controllers/hr/overtime/routes';
import { payrollsRoutes } from './controllers/hr/payrolls/routes';
import { performanceReviewsRoutes } from './controllers/hr/performance-reviews/routes';
import { reviewCompetenciesRoutes } from './controllers/hr/review-competencies/routes';
import { positionsRoutes } from './controllers/hr/positions/routes';
import { ppeAssignmentsRoutes } from './controllers/hr/ppe-assignments/routes';
import { ppeItemsRoutes } from './controllers/hr/ppe-items/routes';
import { complianceRoutes } from './controllers/hr/compliance/routes';
import { punchApprovalsRoutes } from './controllers/hr/punch-approvals/routes';
import { punchDashboardRoutes } from './controllers/hr/punch-dashboard/routes';
import { punchConfigRoutes } from './controllers/hr/punch-config/routes';
import { faceEnrollmentsRoutes } from './controllers/hr/face-enrollments/routes';
import { punchDevicesRoutes } from './controllers/hr/punch-devices/routes';
import { qrTokensRoutes } from './controllers/hr/qr-tokens/routes';
import { badgesRoutes } from './controllers/hr/badges/routes';
import { punchPinRoutes } from './controllers/hr/punch-pin/routes';
import { punchRoutes } from './controllers/hr/punch/routes';
import { recruitmentRoutes } from './controllers/hr/recruitment/routes';
import { hrReportsRoutes } from './controllers/hr/reports/routes';
import { reviewCyclesRoutes } from './controllers/hr/review-cycles/routes';
import { safetyProgramsRoutes } from './controllers/hr/safety-programs/routes';
import { shiftsRoutes } from './controllers/hr/shifts/routes';
import { surveysRoutes } from './controllers/hr/surveys/routes';
import { terminationsRoutes } from './controllers/hr/terminations/routes';
import { timeBankRoutes } from './controllers/hr/time-bank/routes';
import { timeControlRoutes } from './controllers/hr/time-control/routes';
import { trainingEnrollmentsRoutes } from './controllers/hr/training-enrollments/routes';
import { trainingProgramsRoutes } from './controllers/hr/training-programs/routes';
import { vacationPeriodsRoutes } from './controllers/hr/vacation-periods/routes';
import { warningsRoutes } from './controllers/hr/warnings/routes';
import { workSchedulesRoutes } from './controllers/hr/work-schedules/routes';
import { workplaceRisksRoutes } from './controllers/hr/workplace-risks/routes';
import { salaryHistoryRoutes } from './controllers/hr/salary-history/routes';
import { oneOnOnesRoutes } from './controllers/hr/one-on-ones/routes';

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
  await app.register(adminCatalogRoutes);
  await app.register(adminTenantSubscriptionsRoutes);
  await app.register(adminTeamRoutes);
  await app.register(adminMonitoringRoutes);
  await app.register(adminSupportRoutes);
  await app.register(adminBillingRoutes);
  // Admin routes (tenant-scoped)
  await app.register(adminCompaniesRoutes);

  // Tenant Support routes
  await app.register(tenantSupportRoutes);

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
  await app.register(locationsRoutes);
  await app.register(warehousesRoutes);
  await app.register(zonesRoutes);
  await app.register(binsRoutes);
  await app.register(volumesRoutes);
  await app.register(inventorySessionsRoutes);
  await app.register(lookupRoutes);
  await app.register(labelsRoutes);
  await app.register(addressRoutes);
  await app.register(tagsRoutes);
  await app.register(templatesRoutes);
  await app.register(itemsRoutes);
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
  await app.register(blueprintsRoutes);
  await app.register(dealsRoutes);
  await app.register(activitiesRoutes);
  await app.register(timelineRoutes);
  await app.register(salesOrdersRoutes);
  await app.register(ordersRoutes);
  await app.register(paymentConditionsRoutes);
  await app.register(orderReturnsRoutes);
  await app.register(storeCreditsRoutes);
  await app.register(commentsRoutes);
  await app.register(variantPromotionsRoutes);
  await app.register(itemReservationsRoutes);
  await app.register(notificationPreferencesRoutes);
  await app.register(invoicingRoutes);
  await app.register(priceTablesRoutes);
  await app.register(customerPricesRoutes);
  await app.register(campaignsRoutes);
  await app.register(couponsRoutes);
  await app.register(combosRoutes);
  await app.register(catalogsRoutes);
  await app.register(brandRoutes);
  await app.register(contentRoutes);
  await app.register(bidsRoutes);
  await app.register(marketplacesRoutes);
  await app.register(integrationsHubRoutes);
  await app.register(posRoutes);
  await app.register(printAgentsRoutes);
  await app.register(printAgentsPublicRoutes); // Public pairing endpoint (no JWT)
  await app.register(printersRoutes);
  await app.register(printingRoutes);
  await app.register(printAgentWsRoutes); // WebSocket — no module middleware (device token auth)
  await app.register(paymentConfigRoutes);
  await app.register(paymentChargesRoutes);
  // Sales - Planned (placeholder stubs)
  await app.register(commissionsRoutes);
  await app.register(discountsRoutes);
  await app.register(proposalsRoutes);
  await app.register(quotesRoutes);
  await app.register(salesSignaturesRoutes);
  await app.register(cadencesRoutes);
  await app.register(salesTrackingRoutes);
  await app.register(workflowsRoutes);
  await app.register(formsRoutes);
  await app.register(landingPagesRoutes);
  await app.register(msgTemplatesRoutes);
  await app.register(conversationsRoutes);
  await app.register(chatbotRoutes);
  await app.register(predictionsRoutes);
  await app.register(sentimentRoutes);
  await app.register(bidBotRoutes);
  await app.register(salesCashierRoutes);
  await app.register(leadScoringRoutes);
  await app.register(leadRoutingRoutes);
  await app.register(notificationsRoutes);
  await app.register(notificationsV2Routes);
  await app.register(notificationsUnsubscribeRoutes);
  await app.register(notificationsAdminHealthRoutes);

  // Sales - Analytics routes
  await app.register(analyticsGoalsRoutes);
  await app.register(analyticsDashboardsRoutes);
  await app.register(analyticsReportsRoutes);
  await app.register(analyticsRankingsRoutes);
  await app.register(analyticsCustomerPortalRoutes);

  // Requests routes (Workflow)
  await app.register(requestsRoutes);

  // Finance routes
  await app.register(chartOfAccountsRoutes);
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
  await app.register(financeBudgetRoutes);
  await app.register(financeCompaniesRoutes);
  await app.register(reconciliationRoutes);
  await app.register(financeEscalationsRoutes);
  await app.register(financeApprovalRulesRoutes);
  await app.register(financeAccountantRoutes);
  await app.register(bankConnectionsRoutes);
  await app.register(paymentLinksRoutes);
  await app.register(financeExchangeRatesRoutes);
  await app.register(financeCustomerPortalRoutes);
  await app.register(financeComplianceRoutes);
  await app.register(paymentOrdersRoutes);
  await app.register(boletoRoutes);
  await app.register(pixRoutes);
  await app.register(bankWebhookRoutes);
  await app.register(journalEntriesRoutes);
  await app.register(financeReportsRoutes);
  await app.register(financePeriodLockRoutes);

  // Accountant Portal routes (token-based auth, no JWT)
  await app.register(accountantPortalRoutes);

  // Payment webhook routes (public — no auth, called by external providers)
  await app.register(paymentWebhookRoutes);

  // Public routes (no auth)
  await app.register(publicRoutes);

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
  await app.register(shiftsRoutes);
  await app.register(overtimeRoutes);
  await app.register(timeBankRoutes);
  await app.register(absencesRoutes);
  await app.register(vacationPeriodsRoutes);
  await app.register(hrReportsRoutes);
  await app.register(payrollsRoutes);
  await app.register(bonusesRoutes);
  await app.register(dependantsRoutes);
  await app.register(deductionsRoutes);
  await app.register(terminationsRoutes);
  await app.register(punchConfigRoutes);
  await app.register(punchDevicesRoutes);
  await app.register(faceEnrollmentsRoutes);
  await app.register(qrTokensRoutes);
  await app.register(badgesRoutes);
  await app.register(punchPinRoutes);
  await app.register(punchApprovalsRoutes);
  await app.register(punchDashboardRoutes);
  await app.register(complianceRoutes);
  await app.register(punchRoutes);
  await app.register(geofenceZonesRoutes);
  await app.register(medicalExamsRoutes);
  await app.register(examRequirementsRoutes);
  await app.register(safetyProgramsRoutes);
  await app.register(ppeItemsRoutes);
  await app.register(ppeAssignmentsRoutes);
  await app.register(workplaceRisksRoutes);
  await app.register(cipaMandatesRoutes);
  await app.register(cipaMembersRoutes);
  await app.register(hrConfigRoutes);
  await app.register(admissionsRoutes);
  await app.register(esocialRoutes);
  await app.register(employeeRequestsRoutes);
  await app.register(hrAnnouncementsRoutes);
  await app.register(kudosRoutes);
  await app.register(approvalDelegationsRoutes);
  await app.register(onboardingRoutes);
  await app.register(offboardingRoutes);
  await app.register(benefitPlansRoutes);
  await app.register(benefitEnrollmentsRoutes);
  await app.register(flexBenefitsRoutes);
  await app.register(benefitDeductionsRoutes);
  await app.register(trainingProgramsRoutes);
  await app.register(trainingEnrollmentsRoutes);
  await app.register(reviewCyclesRoutes);
  await app.register(performanceReviewsRoutes);
  await app.register(reviewCompetenciesRoutes);
  await app.register(warningsRoutes);
  await app.register(recruitmentRoutes);
  await app.register(surveysRoutes);
  await app.register(okrsRoutes);
  await app.register(hrAnalyticsRoutes);
  await app.register(hrContractsRoutes);
  await app.register(salaryHistoryRoutes);
  await app.register(oneOnOnesRoutes);

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
  await app.register(taskMembersRoutes);
  await app.register(taskIntegrationsRoutes);

  // Signature routes
  await app.register(signatureCertificatesRoutes);
  await app.register(signatureEnvelopesRoutes);
  await app.register(signaturePublicRoutes);
  await app.register(signatureSigningRoutes);
  await app.register(signatureTemplatesRoutes);

  // Public punch verify (Phase 06 / Plan 06-03) — registered alongside
  // signaturePublicRoutes so both public endpoints sit in the same no-auth
  // scope. Rate-limit 30 req/min is applied inside the aggregator.
  await app.register(publicPunchRoutes);

  // AI Assistant routes
  await app.register(aiChatRoutes);
  await app.register(aiInsightsRoutes);
  await app.register(aiConfigRoutes);
  await app.register(aiFavoritesRoutes);
  await app.register(aiActionLogsRoutes);
  await app.register(aiContentRoutes);
  await app.register(aiCampaignsRoutes);
  await app.register(aiWorkflowsRoutes);
  await app.register(aiSetupWizardRoutes);
  await app.register(aiDocumentsRoutes);
  await app.register(aiFinanceRoutes);

  // Messaging routes
  await app.register(messagingRoutes);

  // Cashier routes
  await app.register(cashierRoutes);

  // eSocial routes
  await app.register(esocialConfigRoutes);
  await app.register(esocialCertificatesRoutes);
  await app.register(esocialTablesRoutes);
  await app.register(esocialRubricasRoutes);

  // Production routes
  await app.register(workstationTypesRoutes);
  await app.register(workstationsRoutes);
  await app.register(workCentersRoutes);
  await app.register(bomsRoutes);
  await app.register(bomItemsRoutes);
  await app.register(operationRoutingsRoutes);
  await app.register(productionOrdersRoutes);
  await app.register(downtimeReasonsRoutes);
  await app.register(defectTypesRoutes);
  await app.register(jobCardsRoutes);
  await app.register(downtimeRecordsRoutes);
  await app.register(inspectionPlansRoutes);
  await app.register(qualityHoldsRoutes);
  await app.register(inspectionResultsRoutes);
  await app.register(defectRecordsRoutes);
  await app.register(productionSchedulesRoutes);
  await app.register(productionCostingRoutes);
  await app.register(productionAnalyticsRoutes);
  await app.register(textileRoutes);
  await app.register(timeEntriesRoutes);
  await app.register(productionEntriesRoutes);
  await app.register(materialReservationsRoutes);
  await app.register(materialIssuesRoutes);
  await app.register(materialReturnsRoutes);

  // Fiscal routes
  await app.register(fiscalRoutes);

  // Audit routes
  await app.register(auditRoutes);
}
