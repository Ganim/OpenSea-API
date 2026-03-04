import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCalendarEventsRepository } from '@/repositories/calendar/in-memory/in-memory-calendar-events-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ExportCalendarEventsUseCase } from './export-calendar-events';

let repository: InMemoryCalendarEventsRepository;
let sut: ExportCalendarEventsUseCase;
const tenantId = new UniqueEntityID().toString();
const userId = new UniqueEntityID().toString();

describe('ExportCalendarEventsUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCalendarEventsRepository();
    sut = new ExportCalendarEventsUseCase(repository);
  });

  it('should export events in valid iCal format', async () => {
    await repository.create({
      tenantId,
      calendarId: 'calendar-1',
      title: 'Reunião de equipe',
      startDate: new Date('2026-03-01T10:00:00Z'),
      endDate: new Date('2026-03-01T11:00:00Z'),
      createdBy: userId,
      type: 'MEETING',
    });

    const result = await sut.execute({
      tenantId,
      userId,
      startDate: new Date('2026-03-01T00:00:00Z'),
      endDate: new Date('2026-03-31T23:59:59Z'),
    });

    expect(result.fileName).toBe('opensea-agenda.ics');
    expect(result.mimeType).toBe('text/calendar; charset=utf-8');
    expect(result.data).toContain('BEGIN:VCALENDAR');
    expect(result.data).toContain('END:VCALENDAR');
    expect(result.data).toContain('BEGIN:VEVENT');
    expect(result.data).toContain('SUMMARY:Reunião de equipe');
    expect(result.data).toContain('PRODID:-//OpenSea//Calendar//PT-BR');
  });

  it('should respect date range', async () => {
    await repository.create({
      tenantId,
      calendarId: 'calendar-1',
      title: 'Evento dentro do range',
      startDate: new Date('2026-03-15T10:00:00Z'),
      endDate: new Date('2026-03-15T11:00:00Z'),
      createdBy: userId,
    });

    await repository.create({
      tenantId,
      calendarId: 'calendar-1',
      title: 'Evento fora do range',
      startDate: new Date('2026-04-15T10:00:00Z'),
      endDate: new Date('2026-04-15T11:00:00Z'),
      createdBy: userId,
    });

    const result = await sut.execute({
      tenantId,
      userId,
      startDate: new Date('2026-03-01T00:00:00Z'),
      endDate: new Date('2026-03-31T23:59:59Z'),
    });

    expect(result.data).toContain('Evento dentro do range');
    expect(result.data).not.toContain('Evento fora do range');
  });

  it('should mask private events from other users', async () => {
    const otherUserId = new UniqueEntityID().toString();

    await repository.create({
      tenantId,
      calendarId: 'calendar-1',
      title: 'Evento privado de outro usuário',
      startDate: new Date('2026-03-10T10:00:00Z'),
      endDate: new Date('2026-03-10T11:00:00Z'),
      createdBy: otherUserId,
      visibility: 'PRIVATE',
    });

    await repository.create({
      tenantId,
      calendarId: 'calendar-1',
      title: 'Evento público',
      startDate: new Date('2026-03-10T14:00:00Z'),
      endDate: new Date('2026-03-10T15:00:00Z'),
      createdBy: otherUserId,
    });

    const result = await sut.execute({
      tenantId,
      userId,
      startDate: new Date('2026-03-01T00:00:00Z'),
      endDate: new Date('2026-03-31T23:59:59Z'),
    });

    expect(result.data).not.toContain('Evento privado de outro usuário');
    expect(result.data).toContain('Evento público');
  });

  it('should include RRULE for recurring events', async () => {
    await repository.create({
      tenantId,
      calendarId: 'calendar-1',
      title: 'Reunião semanal',
      startDate: new Date('2026-03-02T09:00:00Z'),
      endDate: new Date('2026-03-02T10:00:00Z'),
      createdBy: userId,
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=MO',
    });

    const result = await sut.execute({
      tenantId,
      userId,
      startDate: new Date('2026-03-01T00:00:00Z'),
      endDate: new Date('2026-03-31T23:59:59Z'),
    });

    expect(result.data).toContain('RRULE');
    expect(result.data).toContain('FREQ=WEEKLY');
  });

  it('should handle all-day events', async () => {
    await repository.create({
      tenantId,
      calendarId: 'calendar-1',
      title: 'Feriado nacional',
      startDate: new Date('2026-03-05T00:00:00Z'),
      endDate: new Date('2026-03-05T23:59:59Z'),
      createdBy: userId,
      isAllDay: true,
      type: 'HOLIDAY',
    });

    const result = await sut.execute({
      tenantId,
      userId,
      startDate: new Date('2026-03-01T00:00:00Z'),
      endDate: new Date('2026-03-31T23:59:59Z'),
    });

    expect(result.data).toContain('Feriado nacional');
    // ical-generator uses VALUE=DATE for all-day events
    expect(result.data).toContain('VEVENT');
  });

  it('should reject date range exceeding 90 days', async () => {
    await expect(
      sut.execute({
        tenantId,
        userId,
        startDate: new Date('2026-01-01T00:00:00Z'),
        endDate: new Date('2026-06-01T00:00:00Z'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject endDate before startDate', async () => {
    await expect(
      sut.execute({
        tenantId,
        userId,
        startDate: new Date('2026-03-31T00:00:00Z'),
        endDate: new Date('2026-03-01T00:00:00Z'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should return empty calendar when no events in range', async () => {
    const result = await sut.execute({
      tenantId,
      userId,
      startDate: new Date('2026-03-01T00:00:00Z'),
      endDate: new Date('2026-03-31T23:59:59Z'),
    });

    expect(result.data).toContain('BEGIN:VCALENDAR');
    expect(result.data).toContain('END:VCALENDAR');
    expect(result.data).not.toContain('BEGIN:VEVENT');
  });
});
