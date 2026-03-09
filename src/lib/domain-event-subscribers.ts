/**
 * Domain Event Subscribers — registers all event handlers at startup.
 *
 * This file wires domain events to their side-effect handlers.
 * Import it once during server startup (after all dependencies are ready).
 */

import { logger } from '@/lib/logger';
import { makeCalendarSyncService } from '@/services/calendar/make-calendar-sync-service';
import {
  DOMAIN_EVENTS,
  domainEventBus,
  type AbsenceApprovedEvent,
  type AbsenceRequestedEvent,
  type DomainEvent,
  type EmployeeCreatedEvent,
  type EmployeeUpdatedEvent,
  type FinanceEntryCreatedEvent,
  type PurchaseOrderCreatedEvent,
} from './domain-events';

export function registerDomainEventSubscribers(): void {
  const calendarSync = makeCalendarSyncService();

  // ─── HR → Calendar ─────────────────────────────────────────────────────

  domainEventBus.on<AbsenceApprovedEvent>(
    DOMAIN_EVENTS.HR_ABSENCE_APPROVED,
    async (event: DomainEvent<AbsenceApprovedEvent>) => {
      await calendarSync.syncAbsence({
        tenantId: event.tenantId,
        absenceId: event.payload.absenceId,
        absenceType: event.payload.absenceType,
        employeeName: event.payload.employeeName,
        startDate: event.payload.startDate,
        endDate: event.payload.endDate,
        userId: event.userId,
      });
    },
  );

  domainEventBus.on<AbsenceRequestedEvent>(
    DOMAIN_EVENTS.HR_ABSENCE_REQUESTED,
    async (event: DomainEvent<AbsenceRequestedEvent>) => {
      await calendarSync.syncAbsence({
        tenantId: event.tenantId,
        absenceId: event.payload.absenceId,
        absenceType: event.payload.absenceType,
        employeeName: event.payload.employeeName,
        startDate: event.payload.startDate,
        endDate: event.payload.endDate,
        userId: event.userId,
      });
    },
  );

  domainEventBus.on<EmployeeCreatedEvent>(
    DOMAIN_EVENTS.HR_EMPLOYEE_CREATED,
    async (event: DomainEvent<EmployeeCreatedEvent>) => {
      if (event.payload.birthDate) {
        await calendarSync.syncBirthday({
          tenantId: event.tenantId,
          employeeId: event.payload.employeeId,
          employeeName: event.payload.employeeName,
          birthDate: event.payload.birthDate,
          userId: event.userId,
        });
      }
    },
  );

  domainEventBus.on<EmployeeUpdatedEvent>(
    DOMAIN_EVENTS.HR_EMPLOYEE_UPDATED,
    async (event: DomainEvent<EmployeeUpdatedEvent>) => {
      if (event.payload.birthDate) {
        await calendarSync.syncBirthday({
          tenantId: event.tenantId,
          employeeId: event.payload.employeeId,
          employeeName: event.payload.employeeName,
          birthDate: event.payload.birthDate,
          userId: event.userId,
        });
      }
    },
  );

  // ─── Finance → Calendar ────────────────────────────────────────────────

  domainEventBus.on<FinanceEntryCreatedEvent>(
    DOMAIN_EVENTS.FINANCE_ENTRY_CREATED,
    async (event: DomainEvent<FinanceEntryCreatedEvent>) => {
      await calendarSync.syncFinanceEntry({
        tenantId: event.tenantId,
        entryId: event.payload.entryId,
        entryType: event.payload.entryType,
        description: event.payload.description,
        dueDate: event.payload.dueDate,
        userId: event.userId,
      });
    },
  );

  // ─── Stock → Calendar ─────────────────────────────────────────────────

  domainEventBus.on<PurchaseOrderCreatedEvent>(
    DOMAIN_EVENTS.STOCK_PO_CREATED,
    async (event: DomainEvent<PurchaseOrderCreatedEvent>) => {
      await calendarSync.syncPurchaseOrder({
        tenantId: event.tenantId,
        poId: event.payload.poId,
        poNumber: event.payload.poNumber,
        supplierName: event.payload.supplierName,
        expectedDate: event.payload.expectedDate,
        userId: event.userId,
      });
    },
  );

  logger.info(
    `[DomainEvents] Registered ${domainEventBus.handlerCount(DOMAIN_EVENTS.HR_ABSENCE_APPROVED) + domainEventBus.handlerCount(DOMAIN_EVENTS.HR_ABSENCE_REQUESTED) + domainEventBus.handlerCount(DOMAIN_EVENTS.HR_EMPLOYEE_CREATED) + domainEventBus.handlerCount(DOMAIN_EVENTS.HR_EMPLOYEE_UPDATED) + domainEventBus.handlerCount(DOMAIN_EVENTS.FINANCE_ENTRY_CREATED) + domainEventBus.handlerCount(DOMAIN_EVENTS.STOCK_PO_CREATED)} event subscribers`,
  );
}
