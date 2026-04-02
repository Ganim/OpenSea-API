import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Calendar } from '@/entities/calendar/calendar';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EnsureSystemCalendarsUseCase } from './ensure-system-calendars';

const tenantId = 'tenant-1';
const userId = 'user-1';

function makeMocks() {
  const calendarsRepository = {
    findSystemByModule: vi.fn(),
    create: vi.fn(),
  } as unknown;

  const sut = new EnsureSystemCalendarsUseCase(calendarsRepository);

  return { sut, calendarsRepository };
}

describe('EnsureSystemCalendarsUseCase', () => {
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
  });

  it('should create all system calendars when none exist', async () => {
    mocks.calendarsRepository.findSystemByModule.mockResolvedValue(null);
    mocks.calendarsRepository.create.mockImplementation(
      async (data: Record<string, unknown>) =>
        Calendar.create({
          tenantId: new UniqueEntityID(data.tenantId),
          name: data.name,
          color: data.color,
          type: data.type,
          systemModule: data.systemModule,
          createdBy: new UniqueEntityID(data.createdBy),
        }),
    );

    await mocks.sut.execute({ tenantId, userId });

    expect(mocks.calendarsRepository.findSystemByModule).toHaveBeenCalledTimes(
      3,
    );
    expect(mocks.calendarsRepository.create).toHaveBeenCalledTimes(3);

    const createCalls = mocks.calendarsRepository.create.mock.calls;
    const modules = createCalls.map(
      (c: Record<string, unknown>[]) =>
        (c[0] as Record<string, unknown>).systemModule,
    );
    expect(modules).toEqual(expect.arrayContaining(['HR', 'FINANCE', 'STOCK']));
  });

  it('should not create calendars that already exist', async () => {
    const existingCalendar = Calendar.create({
      tenantId: new UniqueEntityID(tenantId),
      name: 'Calendário RH',
      type: 'SYSTEM',
      systemModule: 'HR',
      createdBy: new UniqueEntityID(userId),
    });

    mocks.calendarsRepository.findSystemByModule.mockImplementation(
      async (module: string) => (module === 'HR' ? existingCalendar : null),
    );
    mocks.calendarsRepository.create.mockImplementation(
      async (data: Record<string, unknown>) =>
        Calendar.create({
          tenantId: new UniqueEntityID(data.tenantId),
          name: data.name,
          type: data.type,
          createdBy: new UniqueEntityID(data.createdBy),
        }),
    );

    await mocks.sut.execute({ tenantId, userId });

    expect(mocks.calendarsRepository.create).toHaveBeenCalledTimes(2);
  });

  it('should not create any calendars when all already exist', async () => {
    const existing = Calendar.create({
      tenantId: new UniqueEntityID(tenantId),
      name: 'Calendar',
      type: 'SYSTEM',
      createdBy: new UniqueEntityID(userId),
    });

    mocks.calendarsRepository.findSystemByModule.mockResolvedValue(existing);

    await mocks.sut.execute({ tenantId, userId });

    expect(mocks.calendarsRepository.create).not.toHaveBeenCalled();
  });
});
