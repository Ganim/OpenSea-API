import { logger } from '@/lib/logger';
import type { CalendarEventsRepository } from '@/repositories/calendar/calendar-events-repository';

interface SyncAbsenceParams {
  tenantId: string;
  absenceId: string;
  absenceType: string;
  employeeName: string;
  startDate: Date;
  endDate: Date;
  userId: string;
}

interface SyncFinanceEntryParams {
  tenantId: string;
  entryId: string;
  entryType: 'PAYABLE' | 'RECEIVABLE';
  description: string;
  dueDate: Date;
  userId: string;
}

interface SyncPurchaseOrderParams {
  tenantId: string;
  poId: string;
  poNumber: string;
  supplierName: string;
  expectedDate: Date;
  userId: string;
}

interface SyncBirthdayParams {
  tenantId: string;
  employeeId: string;
  employeeName: string;
  birthDate: Date;
  userId: string;
}

export class CalendarSyncService {
  constructor(private calendarEventsRepository: CalendarEventsRepository) {}

  async syncAbsence(params: SyncAbsenceParams): Promise<void> {
    const {
      tenantId,
      absenceId,
      absenceType,
      employeeName,
      startDate,
      endDate,
      userId,
    } = params;

    const isVacation = absenceType === 'VACATION';
    const eventType = isVacation ? 'VACATION' : 'ABSENCE';
    const title = isVacation
      ? `Férias de ${employeeName}`
      : `Ausência: ${employeeName} - ${absenceType}`;

    try {
      const existing = await this.calendarEventsRepository.findBySystemSource(
        tenantId,
        'HR_ABSENCE',
        absenceId,
      );

      if (existing) {
        await this.calendarEventsRepository.update({
          id: existing.id.toString(),
          tenantId,
          title,
          startDate,
          endDate,
          type: eventType,
          isAllDay: true,
        });
      } else {
        await this.calendarEventsRepository.create({
          tenantId,
          title,
          startDate,
          endDate,
          isAllDay: true,
          type: eventType,
          visibility: 'PUBLIC',
          systemSourceType: 'HR_ABSENCE',
          systemSourceId: absenceId,
          createdBy: userId,
        });
      }
    } catch (err) {
      logger.warn(
        { err, absenceId },
        'Failed to sync absence to calendar',
      );
    }
  }

  async syncFinanceEntry(params: SyncFinanceEntryParams): Promise<void> {
    const { tenantId, entryId, entryType, description, dueDate, userId } = params;

    const title =
      entryType === 'PAYABLE'
        ? `Vencimento: ${description}`
        : `Recebimento: ${description}`;

    // For finance entries, use dueDate as both start and end (all-day event)
    const startDate = new Date(dueDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dueDate);
    endDate.setHours(23, 59, 59, 999);

    try {
      const existing = await this.calendarEventsRepository.findBySystemSource(
        tenantId,
        'FINANCE_ENTRY',
        entryId,
      );

      if (existing) {
        await this.calendarEventsRepository.update({
          id: existing.id.toString(),
          tenantId,
          title,
          startDate,
          endDate,
          type: 'FINANCE_DUE',
          isAllDay: true,
        });
      } else {
        await this.calendarEventsRepository.create({
          tenantId,
          title,
          startDate,
          endDate,
          isAllDay: true,
          type: 'FINANCE_DUE',
          visibility: 'PUBLIC',
          systemSourceType: 'FINANCE_ENTRY',
          systemSourceId: entryId,
          createdBy: userId,
        });
      }
    } catch (err) {
      logger.warn(
        { err, entryId },
        'Failed to sync finance entry to calendar',
      );
    }
  }

  async syncPurchaseOrder(params: SyncPurchaseOrderParams): Promise<void> {
    const { tenantId, poId, poNumber, supplierName, expectedDate, userId } =
      params;

    const title = `Entrega PO #${poNumber} - ${supplierName}`;
    const startDate = new Date(expectedDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(expectedDate);
    endDate.setHours(23, 59, 59, 999);

    try {
      const existing = await this.calendarEventsRepository.findBySystemSource(
        tenantId,
        'STOCK_PO',
        poId,
      );

      if (existing) {
        await this.calendarEventsRepository.update({
          id: existing.id.toString(),
          tenantId,
          title,
          startDate,
          endDate,
          type: 'PURCHASE_ORDER',
          isAllDay: true,
        });
      } else {
        await this.calendarEventsRepository.create({
          tenantId,
          title,
          startDate,
          endDate,
          isAllDay: true,
          type: 'PURCHASE_ORDER',
          visibility: 'PUBLIC',
          systemSourceType: 'STOCK_PO',
          systemSourceId: poId,
          createdBy: userId,
        });
      }
    } catch (err) {
      logger.warn({ err, poId }, 'Failed to sync purchase order to calendar');
    }
  }

  async syncBirthday(params: SyncBirthdayParams): Promise<void> {
    const { tenantId, employeeId, employeeName, birthDate, userId } = params;

    const title = `Aniversário de ${employeeName}`;
    // Set to the birth month/day, with current year
    const now = new Date();
    const startDate = new Date(
      now.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate(),
      0, 0, 0,
    );
    const endDate = new Date(
      now.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate(),
      23, 59, 59,
    );

    try {
      const existing = await this.calendarEventsRepository.findBySystemSource(
        tenantId,
        'HR_BIRTHDAY',
        employeeId,
      );

      if (existing) {
        await this.calendarEventsRepository.update({
          id: existing.id.toString(),
          tenantId,
          title,
          startDate,
          endDate,
          type: 'BIRTHDAY',
          isAllDay: true,
          rrule: 'FREQ=YEARLY',
        });
      } else {
        await this.calendarEventsRepository.create({
          tenantId,
          title,
          startDate,
          endDate,
          isAllDay: true,
          type: 'BIRTHDAY',
          visibility: 'PUBLIC',
          rrule: 'FREQ=YEARLY',
          systemSourceType: 'HR_BIRTHDAY',
          systemSourceId: employeeId,
          createdBy: userId,
        });
      }
    } catch (err) {
      logger.warn(
        { err, employeeId },
        'Failed to sync birthday to calendar',
      );
    }
  }

  async removeSystemEvent(
    tenantId: string,
    sourceType: string,
    sourceId: string,
  ): Promise<void> {
    try {
      const existing = await this.calendarEventsRepository.findBySystemSource(
        tenantId,
        sourceType,
        sourceId,
      );

      if (existing) {
        await this.calendarEventsRepository.softDelete(
          existing.id.toString(),
          tenantId,
        );
      }
    } catch (err) {
      logger.warn(
        { err, sourceType, sourceId },
        'Failed to remove system event from calendar',
      );
    }
  }
}
