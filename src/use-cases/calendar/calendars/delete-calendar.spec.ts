import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteCalendarUseCase } from './delete-calendar';
import { InMemoryCalendarsRepository } from '@/repositories/calendar/in-memory/in-memory-calendars-repository';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';

let calendarsRepository: InMemoryCalendarsRepository;
let sut: DeleteCalendarUseCase;

describe('DeleteCalendarUseCase', () => {
  beforeEach(() => {
    calendarsRepository = new InMemoryCalendarsRepository();
    sut = new DeleteCalendarUseCase(calendarsRepository);
  });

  it('should soft-delete a team calendar as OWNER', async () => {
    const created = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'Team Calendar',
      type: 'TEAM',
      ownerId: 'team-1',
      isDefault: false,
      settings: {},
      createdBy: 'user-1',
    });

    await sut.execute({
      calendarId: created.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-1',
      teamRole: 'OWNER',
    });

    const found = await calendarsRepository.findById(
      created.id.toString(),
      'tenant-1',
    );
    expect(found).toBeNull();
  });

  it('should reject deletion of team calendar by ADMIN', async () => {
    const created = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'Team Calendar',
      type: 'TEAM',
      ownerId: 'team-1',
      isDefault: false,
      settings: {},
      createdBy: 'user-1',
    });

    await expect(
      sut.execute({
        calendarId: created.id.toString(),
        tenantId: 'tenant-1',
        userId: 'user-1',
        teamRole: 'ADMIN',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should reject deletion of team calendar by MEMBER', async () => {
    const created = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'Team Calendar',
      type: 'TEAM',
      ownerId: 'team-1',
      isDefault: false,
      settings: {},
      createdBy: 'user-1',
    });

    await expect(
      sut.execute({
        calendarId: created.id.toString(),
        tenantId: 'tenant-1',
        userId: 'user-1',
        teamRole: 'MEMBER',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should reject deletion of personal calendar', async () => {
    const created = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'My Calendar',
      type: 'PERSONAL',
      ownerId: 'user-1',
      isDefault: true,
      settings: {},
      createdBy: 'user-1',
    });

    await expect(
      sut.execute({
        calendarId: created.id.toString(),
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject deletion of system calendar', async () => {
    const created = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'System Calendar',
      type: 'SYSTEM',
      systemModule: 'HR',
      isDefault: false,
      settings: {},
      createdBy: 'user-1',
    });

    await expect(
      sut.execute({
        calendarId: created.id.toString(),
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw ResourceNotFoundError for non-existent calendar', async () => {
    await expect(
      sut.execute({
        calendarId: 'non-existent',
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should reject deletion of team calendar without teamRole', async () => {
    const created = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'Team Calendar',
      type: 'TEAM',
      ownerId: 'team-1',
      isDefault: false,
      settings: {},
      createdBy: 'user-1',
    });

    await expect(
      sut.execute({
        calendarId: created.id.toString(),
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
