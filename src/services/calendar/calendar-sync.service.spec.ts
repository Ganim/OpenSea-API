import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { CalendarSyncService } from './calendar-sync.service';
import { InMemoryCalendarEventsRepository } from '@/repositories/calendar/in-memory/in-memory-calendar-events-repository';
import { InMemoryCalendarsRepository } from '@/repositories/calendar/in-memory/in-memory-calendars-repository';

let repo: InMemoryCalendarEventsRepository;
let calendarsRepo: InMemoryCalendarsRepository;
let sut: CalendarSyncService;

describe('CalendarSyncService', () => {
  beforeEach(async () => {
    repo = new InMemoryCalendarEventsRepository();
    calendarsRepo = new InMemoryCalendarsRepository();
    sut = new CalendarSyncService(repo, calendarsRepo);

    // Create system calendars for each module
    await calendarsRepo.create({
      tenantId: 'tenant-1',
      name: 'Calendário RH',
      color: '#8b5cf6',
      type: 'SYSTEM',
      systemModule: 'HR',
      createdBy: '00000000-0000-0000-0000-000000000000',
    });
    await calendarsRepo.create({
      tenantId: 'tenant-1',
      name: 'Calendário Financeiro',
      color: '#10b981',
      type: 'SYSTEM',
      systemModule: 'FINANCE',
      createdBy: '00000000-0000-0000-0000-000000000000',
    });
    await calendarsRepo.create({
      tenantId: 'tenant-1',
      name: 'Calendário Estoque',
      color: '#f59e0b',
      type: 'SYSTEM',
      systemModule: 'STOCK',
      createdBy: '00000000-0000-0000-0000-000000000000',
    });
  });

  describe('syncAbsence', () => {
    it('should create a VACATION event for vacation absences', async () => {
      await sut.syncAbsence({
        tenantId: 'tenant-1',
        absenceId: 'absence-1',
        absenceType: 'VACATION',
        employeeName: 'João Silva',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-15'),
        userId: 'user-1',
      });

      expect(repo.items).toHaveLength(1);
      expect(repo.items[0].type).toBe('VACATION');
      expect(repo.items[0].title).toBe('Férias de João Silva');
      expect(repo.items[0].systemSourceType).toBe('HR_ABSENCE');
      expect(repo.items[0].systemSourceId).toBe('absence-1');
      expect(repo.items[0].isAllDay).toBe(true);
      expect(repo.items[0].calendarId).toBeTruthy();
    });

    it('should create an ABSENCE event for non-vacation absences', async () => {
      await sut.syncAbsence({
        tenantId: 'tenant-1',
        absenceId: 'absence-2',
        absenceType: 'MEDICAL',
        employeeName: 'Maria Santos',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-03'),
        userId: 'user-1',
      });

      expect(repo.items[0].type).toBe('ABSENCE');
      expect(repo.items[0].title).toBe('Ausência: Maria Santos - MEDICAL');
    });

    it('should update existing event on re-sync', async () => {
      await sut.syncAbsence({
        tenantId: 'tenant-1',
        absenceId: 'absence-1',
        absenceType: 'VACATION',
        employeeName: 'João Silva',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-15'),
        userId: 'user-1',
      });

      await sut.syncAbsence({
        tenantId: 'tenant-1',
        absenceId: 'absence-1',
        absenceType: 'VACATION',
        employeeName: 'João Silva',
        startDate: new Date('2026-03-05'),
        endDate: new Date('2026-03-20'),
        userId: 'user-1',
      });

      expect(repo.items).toHaveLength(1);
    });
  });

  describe('syncFinanceEntry', () => {
    it('should create a FINANCE_DUE event for payable entries', async () => {
      await sut.syncFinanceEntry({
        tenantId: 'tenant-1',
        entryId: 'entry-1',
        entryType: 'PAYABLE',
        description: 'Aluguel Janeiro',
        dueDate: new Date('2026-03-10'),
        userId: 'user-1',
      });

      expect(repo.items).toHaveLength(1);
      expect(repo.items[0].type).toBe('FINANCE_DUE');
      expect(repo.items[0].title).toBe('Vencimento: Aluguel Janeiro');
      expect(repo.items[0].systemSourceType).toBe('FINANCE_ENTRY');
      expect(repo.items[0].calendarId).toBeTruthy();
    });

    it('should create event with "Recebimento" for receivable entries', async () => {
      await sut.syncFinanceEntry({
        tenantId: 'tenant-1',
        entryId: 'entry-2',
        entryType: 'RECEIVABLE',
        description: 'Fatura Cliente X',
        dueDate: new Date('2026-03-15'),
        userId: 'user-1',
      });

      expect(repo.items[0].title).toBe('Recebimento: Fatura Cliente X');
    });
  });

  describe('syncPurchaseOrder', () => {
    it('should create a PURCHASE_ORDER event', async () => {
      await sut.syncPurchaseOrder({
        tenantId: 'tenant-1',
        poId: 'po-1',
        poNumber: '001',
        supplierName: 'Fornecedor ABC',
        expectedDate: new Date('2026-04-01'),
        userId: 'user-1',
      });

      expect(repo.items).toHaveLength(1);
      expect(repo.items[0].type).toBe('PURCHASE_ORDER');
      expect(repo.items[0].title).toBe('Entrega PO #001 - Fornecedor ABC');
      expect(repo.items[0].systemSourceType).toBe('STOCK_PO');
      expect(repo.items[0].calendarId).toBeTruthy();
    });
  });

  describe('syncBirthday', () => {
    it('should create a BIRTHDAY event with yearly recurrence', async () => {
      await sut.syncBirthday({
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        employeeName: 'Ana Costa',
        birthDate: new Date('1990-07-15'),
        userId: 'user-1',
      });

      expect(repo.items).toHaveLength(1);
      expect(repo.items[0].type).toBe('BIRTHDAY');
      expect(repo.items[0].title).toBe('Aniversário de Ana Costa');
      expect(repo.items[0].rrule).toBe('FREQ=YEARLY');
      expect(repo.items[0].systemSourceType).toBe('HR_BIRTHDAY');
    });
  });

  describe('removeSystemEvent', () => {
    it('should soft delete an existing system event', async () => {
      await sut.syncAbsence({
        tenantId: 'tenant-1',
        absenceId: 'absence-1',
        absenceType: 'VACATION',
        employeeName: 'João',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-15'),
        userId: 'user-1',
      });

      expect(repo.items).toHaveLength(1);
      expect(repo.items[0].deletedAt).toBeNull();

      await sut.removeSystemEvent('tenant-1', 'HR_ABSENCE', 'absence-1');

      expect(repo.items[0].deletedAt).toBeTruthy();
    });

    it('should not throw if event does not exist', async () => {
      await expect(
        sut.removeSystemEvent('tenant-1', 'HR_ABSENCE', 'non-existent'),
      ).resolves.not.toThrow();
    });
  });
});
