/**
 * Named Schema Registration for OpenAPI $ref support.
 *
 * Registers key Zod schemas in Zod's global registry so that
 * fastify-type-provider-zod generates $ref references in the
 * OpenAPI spec instead of duplicating inline definitions.
 *
 * Usage: import this file once at startup (before routes register).
 * The schemas themselves are unchanged — only their registry metadata is added.
 */

import { z } from 'zod';

// ─── Common ────────────────────────────────────────────────────────────────
import { paginationSchema } from './common.schema';

const PaginationMeta = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  pages: z.number().int().nonnegative(),
});

const ErrorResponse = z.object({
  message: z.string(),
});

z.globalRegistry.add(PaginationMeta, { id: 'PaginationMeta' });
z.globalRegistry.add(ErrorResponse, { id: 'ErrorResponse' });
z.globalRegistry.add(paginationSchema, { id: 'PaginationQuery' });

// ─── Stock ─────────────────────────────────────────────────────────────────
import {
  createProductSchema,
  productResponseSchema,
  updateProductSchema,
} from './stock/products/product.schema';
import {
  createVariantSchema,
  variantResponseSchema,
} from './stock/variants/variant.schema';
import { itemResponseSchema } from './stock/items/item.schema';

z.globalRegistry.add(createProductSchema, { id: 'CreateProduct' });
z.globalRegistry.add(updateProductSchema, { id: 'UpdateProduct' });
z.globalRegistry.add(productResponseSchema, { id: 'Product' });
z.globalRegistry.add(createVariantSchema, { id: 'CreateVariant' });
z.globalRegistry.add(variantResponseSchema, { id: 'Variant' });
z.globalRegistry.add(itemResponseSchema, { id: 'Item' });

// ─── Finance ───────────────────────────────────────────────────────────────
import {
  createFinanceEntrySchema,
  financeEntryResponseSchema,
} from './finance/finance-entry.schema';
import { bankAccountResponseSchema } from './finance/bank-account.schema';
import { financeCategoryResponseSchema } from './finance/finance-category.schema';

z.globalRegistry.add(createFinanceEntrySchema, { id: 'CreateFinanceEntry' });
z.globalRegistry.add(financeEntryResponseSchema, { id: 'FinanceEntry' });
z.globalRegistry.add(bankAccountResponseSchema, { id: 'BankAccount' });
z.globalRegistry.add(financeCategoryResponseSchema, { id: 'FinanceCategory' });

// ─── HR ────────────────────────────────────────────────────────────────────
import {
  createEmployeeSchema,
  employeeResponseSchema,
} from './hr/employees/employee.schema';
import { departmentResponseSchema } from './hr/organization/department.schema';

z.globalRegistry.add(createEmployeeSchema, { id: 'CreateEmployee' });
z.globalRegistry.add(employeeResponseSchema, { id: 'Employee' });
z.globalRegistry.add(departmentResponseSchema, { id: 'Department' });

// ─── Calendar ──────────────────────────────────────────────────────────────
import {
  calendarEventResponseSchema,
  createCalendarEventSchema,
} from './calendar/calendar-event.schema';

z.globalRegistry.add(createCalendarEventSchema, { id: 'CreateCalendarEvent' });
z.globalRegistry.add(calendarEventResponseSchema, { id: 'CalendarEvent' });

// ─── Storage ───────────────────────────────────────────────────────────────
import { storageFileResponseSchema } from './storage/storage-file.schema';
import { storageFolderResponseSchema } from './storage/storage-folder.schema';

z.globalRegistry.add(storageFileResponseSchema, { id: 'StorageFile' });
z.globalRegistry.add(storageFolderResponseSchema, { id: 'StorageFolder' });

// ─── Sales ─────────────────────────────────────────────────────────────────
import { customerResponseSchema } from './sales/customers/customer.schema';
import { salesOrderResponseSchema } from './sales/orders/sales-order.schema';

z.globalRegistry.add(customerResponseSchema, { id: 'Customer' });
z.globalRegistry.add(salesOrderResponseSchema, { id: 'SalesOrder' });

// ─── Auth / Users ──────────────────────────────────────────────────────────
import { userResponseSchema } from './core/users/user.schema';
import { sessionResponseSchema } from './core/sessions/session.schema';

z.globalRegistry.add(userResponseSchema, { id: 'User' });
z.globalRegistry.add(sessionResponseSchema, { id: 'Session' });

export { PaginationMeta, ErrorResponse };
