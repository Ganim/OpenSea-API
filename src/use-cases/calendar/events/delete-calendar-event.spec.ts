import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteCalendarEventUseCase } from './delete-calendar-event';
import { InMemoryCalendarEventsRepository } from '@/repositories/calendar/in-memory/in-memory-calendar-events-repository';

let repository: InMemoryCalendarEventsRepository;
let sut: DeleteCalendarEventUseCase;

describe('DeleteCalendarEventUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCalendarEventsRepository();
    sut = new DeleteCalendarEventUseCase(repository);
  });

  it('should soft delete a calendar event', async () => {
    const created = await repository.create({
      tenantId: 'tenant-1',
      calendarId: 'calendar-1',
      title: 'To Delete',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-1',
    });

    await sut.execute({
      id: created.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    const found = await repository.findById(created.id.toString(), 'tenant-1');
    expect(found).toBeNull(); // soft deleted, findById filters deleted
  });

  it('should reject deletion of system event', async () => {
    const created = await repository.create({
      tenantId: 'tenant-1',
      calendarId: 'calendar-1',
      title: 'System Event',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-1',
      systemSourceType: 'FINANCE',
      systemSourceId: 'entry-123',
    });

    await expect(
      sut.execute({
        id: created.id.toString(),
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    ).rejects.toThrow('System events cannot be deleted');
  });

  it('should reject deletion by non-creator', async () => {
    const created = await repository.create({
      tenantId: 'tenant-1',
      calendarId: 'calendar-1',
      title: 'My Event',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-1',
    });

    await expect(
      sut.execute({
        id: created.id.toString(),
        tenantId: 'tenant-1',
        userId: 'user-2',
      }),
    ).rejects.toThrow('Only the event creator can delete this event');
  });

  it('should allow deletion by non-creator with manage permission', async () => {
    const created = await repository.create({
      tenantId: 'tenant-1',
      calendarId: 'calendar-1',
      title: 'Someone Else Event',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-1',
    });

    await sut.execute({
      id: created.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-2',
      hasManagePermission: true,
    });

    const found = await repository.findById(created.id.toString(), 'tenant-1');
    expect(found).toBeNull();
  });

  describe('Multi-tenant isolation', () => {
    it('should not delete event from another tenant', async () => {
      const created = await repository.create({
        tenantId: 'tenant-1',
        calendarId: 'calendar-1',
        title: 'Tenant 1 Event',
        startDate: new Date('2026-03-01T10:00:00'),
        endDate: new Date('2026-03-01T11:00:00'),
        createdBy: 'user-1',
      });

      await expect(
        sut.execute({
          id: created.id.toString(),
          tenantId: 'tenant-2',
          userId: 'user-1',
        }),
      ).rejects.toThrow('Event not found');
    });
  });
});
