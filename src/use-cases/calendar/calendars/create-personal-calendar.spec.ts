import { describe, it, expect, beforeEach } from 'vitest';
import { CreatePersonalCalendarUseCase } from './create-personal-calendar';
import { InMemoryCalendarsRepository } from '@/repositories/calendar/in-memory/in-memory-calendars-repository';

let calendarsRepository: InMemoryCalendarsRepository;
let sut: CreatePersonalCalendarUseCase;

describe('CreatePersonalCalendarUseCase', () => {
  beforeEach(() => {
    calendarsRepository = new InMemoryCalendarsRepository();
    sut = new CreatePersonalCalendarUseCase(calendarsRepository);
  });

  it('should create a personal calendar', async () => {
    const { calendar } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(calendar.name).toBe('Meu Calendário');
    expect(calendar.type).toBe('PERSONAL');
    expect(calendar.color).toBe('#3b82f6');
    expect(calendar.isDefault).toBe(true);
    expect(calendarsRepository.items).toHaveLength(1);
  });

  it('should return existing personal calendar (idempotent)', async () => {
    await sut.execute({ tenantId: 'tenant-1', userId: 'user-1' });
    const { calendar } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(calendarsRepository.items).toHaveLength(1);
    expect(calendar.name).toBe('Meu Calendário');
  });

  it('should create separate calendars for different users', async () => {
    await sut.execute({ tenantId: 'tenant-1', userId: 'user-1' });
    await sut.execute({ tenantId: 'tenant-1', userId: 'user-2' });

    expect(calendarsRepository.items).toHaveLength(2);
  });

  it('should include access permissions for owner', async () => {
    const { calendar } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(calendar.access.canRead).toBe(true);
    expect(calendar.access.canCreate).toBe(true);
    expect(calendar.access.canEdit).toBe(true);
    expect(calendar.access.canDelete).toBe(false);
    expect(calendar.access.canShare).toBe(true);
  });
});
