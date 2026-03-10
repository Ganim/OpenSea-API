import { logger } from '@/lib/logger';
import type { CalendarEventsRepository } from '@/repositories/calendar/calendar-events-repository';
import type { CalendarsRepository } from '@/repositories/calendar/calendars-repository';

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
  constructor(
    private calendarEventsRepository: CalendarEventsRepository,
    private calendarsRepository?: CalendarsRepository,
  ) {}

  private async resolveSystemCalendarId(
    tenantId: string,
    module: string,
  ): Promise<string | undefined> {
    if (!this.calendarsRepository) return undefined;
    const calendar = await this.calendarsRepository.findSystemByModule(
      module,
      tenantId,
    );
    return calendar?.id.toString();
  }

  private async resolvePersonalCalendarId(
    tenantId: string,
    userId: string,
  ): Promise<string | undefined> {
    if (!this.calendarsRepository) return undefined;
    const calendar = await this.calendarsRepository.findPersonalByUser(
      userId,
      tenantId,
    );
    return calendar?.id.toString();
  }

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
      const calendarId =
        (await this.resolveSystemCalendarId(tenantId, 'HR')) ??
        (await this.resolvePersonalCalendarId(tenantId, userId));

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
      } else if (calendarId) {
        await this.calendarEventsRepository.create({
          tenantId,
          calendarId,
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
      } else {
        logger.warn(
          { tenantId, absenceId },
          'No calendar found for HR absence sync',
        );
      }
    } catch (err) {
      logger.warn({ err, absenceId }, 'Failed to sync absence to calendar');
    }
  }

  async syncFinanceEntry(params: SyncFinanceEntryParams): Promise<void> {
    const { tenantId, entryId, entryType, description, dueDate, userId } =
      params;

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
      const calendarId =
        (await this.resolveSystemCalendarId(tenantId, 'FINANCE')) ??
        (await this.resolvePersonalCalendarId(tenantId, userId));

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
      } else if (calendarId) {
        await this.calendarEventsRepository.create({
          tenantId,
          calendarId,
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
      } else {
        logger.warn(
          { tenantId, entryId },
          'No calendar found for finance entry sync',
        );
      }
    } catch (err) {
      logger.warn({ err, entryId }, 'Failed to sync finance entry to calendar');
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
      const calendarId =
        (await this.resolveSystemCalendarId(tenantId, 'STOCK')) ??
        (await this.resolvePersonalCalendarId(tenantId, userId));

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
      } else if (calendarId) {
        await this.calendarEventsRepository.create({
          tenantId,
          calendarId,
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
      } else {
        logger.warn(
          { tenantId, poId },
          'No calendar found for purchase order sync',
        );
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
      0,
      0,
      0,
    );
    const endDate = new Date(
      now.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate(),
      23,
      59,
      59,
    );

    try {
      const calendarId =
        (await this.resolveSystemCalendarId(tenantId, 'HR')) ??
        (await this.resolvePersonalCalendarId(tenantId, userId));

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
      } else if (calendarId) {
        await this.calendarEventsRepository.create({
          tenantId,
          calendarId,
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
      } else {
        logger.warn(
          { tenantId, employeeId },
          'No calendar found for birthday sync',
        );
      }
    } catch (err) {
      logger.warn({ err, employeeId }, 'Failed to sync birthday to calendar');
    }
  }

  async syncTaskDue(params: {
    tenantId: string;
    cardId: string;
    title: string;
    dueDate: Date;
    userId: string;
  }): Promise<void> {
    const { tenantId, cardId, title, dueDate, userId } = params;

    const eventTitle = `📋 ${title}`;
    const startDate = new Date(dueDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dueDate);
    endDate.setHours(23, 59, 59, 999);

    try {
      const calendarId =
        (await this.resolveSystemCalendarId(tenantId, 'TASKS')) ??
        (await this.resolvePersonalCalendarId(tenantId, userId));

      const existing = await this.calendarEventsRepository.findBySystemSource(
        tenantId,
        'TASK_DUE',
        cardId,
      );

      if (existing) {
        await this.calendarEventsRepository.update({
          id: existing.id.toString(),
          tenantId,
          title: eventTitle,
          startDate,
          endDate,
          type: 'TASK',
          isAllDay: true,
        });
      } else if (calendarId) {
        await this.calendarEventsRepository.create({
          tenantId,
          calendarId,
          title: eventTitle,
          startDate,
          endDate,
          isAllDay: true,
          type: 'TASK',
          visibility: 'PUBLIC',
          systemSourceType: 'TASK_DUE',
          systemSourceId: cardId,
          createdBy: userId,
        });
      } else {
        logger.warn(
          { tenantId, cardId },
          'No calendar found for task due date sync',
        );
      }
    } catch (err) {
      logger.warn({ err, cardId }, 'Failed to sync task due date to calendar');
    }
  }

  async updateFinanceEventOnPayment(params: {
    tenantId: string;
    entryId: string;
    entryType: 'PAYABLE' | 'RECEIVABLE';
    description: string;
    status: string;
  }): Promise<void> {
    const { tenantId, entryId, entryType, description, status } = params;

    try {
      const existing = await this.calendarEventsRepository.findBySystemSource(
        tenantId,
        'FINANCE_ENTRY',
        entryId,
      );

      if (!existing) return;

      let prefix: string;
      if (status === 'PAID' || status === 'RECEIVED') {
        prefix = entryType === 'PAYABLE' ? '[Pago]' : '[Recebido]';
      } else if (status === 'PARTIALLY_PAID') {
        prefix = '[Parcial]';
      } else {
        return; // No update needed for other statuses
      }

      const baseDescription = description
        .replace(/^\[Pago\]\s*/, '')
        .replace(/^\[Recebido\]\s*/, '')
        .replace(/^\[Parcial\]\s*/, '');

      const baseTitle = entryType === 'PAYABLE'
        ? `Vencimento: ${baseDescription}`
        : `Recebimento: ${baseDescription}`;

      const title = `${prefix} ${baseTitle}`;

      await this.calendarEventsRepository.update({
        id: existing.id.toString(),
        tenantId,
        title,
      });
    } catch (err) {
      logger.warn(
        { err, entryId },
        'Failed to update finance event on payment',
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
