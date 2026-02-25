import { describe, it, expect, beforeEach } from 'vitest';
import { ListCalendarEventsUseCase } from './list-calendar-events';
import { InMemoryCalendarEventsRepository } from '@/repositories/calendar/in-memory/in-memory-calendar-events-repository';

let repository: InMemoryCalendarEventsRepository;
let sut: ListCalendarEventsUseCase;

describe('ListCalendarEventsUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCalendarEventsRepository();
    sut = new ListCalendarEventsUseCase(repository);
  });

  it('should list events within date range', async () => {
    await repository.create({
      tenantId: 'tenant-1',
      title: 'Event 1',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-1',
    });

    await repository.create({
      tenantId: 'tenant-1',
      title: 'Event 2',
      startDate: new Date('2026-04-01T10:00:00'),
      endDate: new Date('2026-04-01T11:00:00'),
      createdBy: 'user-1',
    });

    const { events } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      startDate: new Date('2026-03-01T00:00:00'),
      endDate: new Date('2026-03-31T23:59:59'),
    });

    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('Event 1');
  });

  it('should reject range greater than 90 days', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-06-01'),
      }),
    ).rejects.toThrow('Date range cannot exceed 90 days');
  });

  it('should filter by type', async () => {
    await repository.create({
      tenantId: 'tenant-1',
      title: 'Meeting',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-1',
      type: 'MEETING',
    });

    await repository.create({
      tenantId: 'tenant-1',
      title: 'Task',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-1',
      type: 'TASK',
    });

    const { events } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      startDate: new Date('2026-03-01T00:00:00'),
      endDate: new Date('2026-03-31T23:59:59'),
      type: 'MEETING',
    });

    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('Meeting');
  });

  it('should hide private events from non-participants', async () => {
    await repository.create({
      tenantId: 'tenant-1',
      title: 'Private Event',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-1',
      visibility: 'PRIVATE',
    });

    const { events } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-2',
      startDate: new Date('2026-03-01T00:00:00'),
      endDate: new Date('2026-03-31T23:59:59'),
    });

    expect(events).toHaveLength(0);
  });

  describe('Brazilian holidays', () => {
    it('should include holidays in the date range', async () => {
      // January 2026 has Confraternização Universal (Jan 1)
      const { events } = await sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        startDate: new Date('2026-01-01T00:00:00'),
        endDate: new Date('2026-01-31T23:59:59'),
      });

      const holiday = events.find((e) => e.title === 'Confraternização Universal');
      expect(holiday).toBeDefined();
      expect(holiday!.type).toBe('HOLIDAY');
      expect(holiday!.isAllDay).toBe(true);
      expect(holiday!.systemSourceType).toBe('HOLIDAY');
      expect(holiday!.systemSourceId).toBe('2026-01-01');
      expect(holiday!.createdBy).toBe('00000000-0000-0000-0000-000000000000');
      // ID is a deterministic UUID
      expect(holiday!.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('should include multiple holidays when range covers them', async () => {
      // Feb 2026: Carnaval (Feb 17)
      // Apr 2026: Sexta-feira Santa (Apr 3), Tiradentes (Apr 21)
      const { events } = await sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        startDate: new Date('2026-02-01T00:00:00'),
        endDate: new Date('2026-04-30T23:59:59'),
      });

      const holidayNames = events
        .filter((e) => e.type === 'HOLIDAY')
        .map((e) => e.title);

      expect(holidayNames).toContain('Carnaval');
      expect(holidayNames).toContain('Sexta-feira Santa');
      expect(holidayNames).toContain('Tiradentes');
    });

    it('should not include holidays when filtering by non-HOLIDAY type', async () => {
      const { events } = await sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        startDate: new Date('2026-01-01T00:00:00'),
        endDate: new Date('2026-01-31T23:59:59'),
        type: 'MEETING',
      });

      const holidays = events.filter((e) => e.type === 'HOLIDAY');
      expect(holidays).toHaveLength(0);
    });

    it('should include only holidays when filtering by HOLIDAY type', async () => {
      await repository.create({
        tenantId: 'tenant-1',
        title: 'My Event',
        startDate: new Date('2026-01-05T10:00:00'),
        endDate: new Date('2026-01-05T11:00:00'),
        createdBy: 'user-1',
        type: 'MEETING',
      });

      const { events } = await sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        startDate: new Date('2026-01-01T00:00:00'),
        endDate: new Date('2026-01-31T23:59:59'),
        type: 'HOLIDAY',
      });

      expect(events.every((e) => e.type === 'HOLIDAY')).toBe(true);
      expect(events.length).toBeGreaterThan(0);
    });

    it('should not include holidays when includeSystemEvents is false', async () => {
      const { events } = await sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        startDate: new Date('2026-01-01T00:00:00'),
        endDate: new Date('2026-01-31T23:59:59'),
        includeSystemEvents: false,
      });

      const holidays = events.filter((e) => e.type === 'HOLIDAY');
      expect(holidays).toHaveLength(0);
    });

    it('should not include holidays when search is provided', async () => {
      const { events } = await sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        startDate: new Date('2026-01-01T00:00:00'),
        endDate: new Date('2026-01-31T23:59:59'),
        search: 'something',
      });

      const holidays = events.filter((e) => e.type === 'HOLIDAY');
      expect(holidays).toHaveLength(0);
    });

    it('should mix holidays with regular events sorted by date', async () => {
      await repository.create({
        tenantId: 'tenant-1',
        title: 'Meeting Jan 15',
        startDate: new Date('2026-01-15T10:00:00'),
        endDate: new Date('2026-01-15T11:00:00'),
        createdBy: 'user-1',
      });

      const { events } = await sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        startDate: new Date('2026-01-01T00:00:00'),
        endDate: new Date('2026-01-31T23:59:59'),
      });

      // Confraternização (Jan 1) should come before Meeting (Jan 15)
      const holidayIdx = events.findIndex((e) => e.title === 'Confraternização Universal');
      const meetingIdx = events.findIndex((e) => e.title === 'Meeting Jan 15');
      expect(holidayIdx).toBeLessThan(meetingIdx);
    });
  });
});
