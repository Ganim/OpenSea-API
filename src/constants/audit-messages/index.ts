/**
 * Mensagens de Auditoria
 *
 * Este módulo centraliza todas as mensagens de auditoria do sistema,
 * organizadas por módulo para facilitar manutenção e internacionalização.
 *
 * @example
 * import { AUDIT_MESSAGES } from '@/constants/audit-messages';
 * import { logAudit } from '@/http/helpers/audit.helper';
 *
 * await logAudit(request, {
 *   message: AUDIT_MESSAGES.HR.EMPLOYEE_CREATE,
 *   entityId: employee.id,
 *   placeholders: {
 *     adminName: 'João Silva',
 *     employeeName: 'Maria Santos',
 *   },
 *   newData: employeeData,
 * });
 */

export * from './types';
export { CORE_AUDIT_MESSAGES } from './core.messages';
export { RBAC_AUDIT_MESSAGES } from './rbac.messages';
export { STOCK_AUDIT_MESSAGES } from './stock.messages';
export { HR_AUDIT_MESSAGES } from './hr.messages';
export { SALES_AUDIT_MESSAGES } from './sales.messages';
export { NOTIFICATIONS_AUDIT_MESSAGES } from './notifications.messages';
export { REQUESTS_AUDIT_MESSAGES } from './requests.messages';
export { FINANCE_AUDIT_MESSAGES } from './finance.messages';

import { CORE_AUDIT_MESSAGES } from './core.messages';
import { HR_AUDIT_MESSAGES } from './hr.messages';
import { NOTIFICATIONS_AUDIT_MESSAGES } from './notifications.messages';
import { RBAC_AUDIT_MESSAGES } from './rbac.messages';
import { REQUESTS_AUDIT_MESSAGES } from './requests.messages';
import { SALES_AUDIT_MESSAGES } from './sales.messages';
import { STOCK_AUDIT_MESSAGES } from './stock.messages';
import { FINANCE_AUDIT_MESSAGES } from './finance.messages';

/**
 * Objeto consolidado com todas as mensagens de auditoria organizadas por módulo
 *
 * @example
 * AUDIT_MESSAGES.CORE.AUTH_LOGIN
 * AUDIT_MESSAGES.HR.EMPLOYEE_CREATE
 * AUDIT_MESSAGES.STOCK.PRODUCT_CREATE
 */
export const AUDIT_MESSAGES = {
  CORE: CORE_AUDIT_MESSAGES,
  RBAC: RBAC_AUDIT_MESSAGES,
  STOCK: STOCK_AUDIT_MESSAGES,
  HR: HR_AUDIT_MESSAGES,
  SALES: SALES_AUDIT_MESSAGES,
  NOTIFICATIONS: NOTIFICATIONS_AUDIT_MESSAGES,
  REQUESTS: REQUESTS_AUDIT_MESSAGES,
  FINANCE: FINANCE_AUDIT_MESSAGES,
} as const;
