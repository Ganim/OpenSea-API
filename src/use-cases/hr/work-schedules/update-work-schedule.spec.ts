import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryWorkSchedulesRepository } from '@/repositories/hr/in-memory/in-memory-work-schedules-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateWorkScheduleUseCase } from './update-work-schedule';

let workSchedulesRepository: InMemoryWorkSchedulesRepository;
let sut: UpdateWorkScheduleUseCase;

describe('Update Work Schedule Use Case', () => {
  beforeEach(() => {
    workSchedulesRepository = new InMemoryWorkSchedulesRepository();
    sut = new UpdateWorkScheduleUseCase(workSchedulesRepository);
  });

  it('should update work schedule name', async () => {
    const schedule = await workSchedulesRepository.create({
      name: 'Original Name',
      mondayStart: '08:00',
      mondayEnd: '17:00',
      breakDuration: 60,
    });

    const result = await sut.execute({
      id: schedule.id.toString(),
      name: 'Updated Name',
    });

    expect(result.workSchedule.name).toBe('Updated Name');
  });

  it('should update work schedule times', async () => {
    const schedule = await workSchedulesRepository.create({
      name: 'Schedule',
      mondayStart: '08:00',
      mondayEnd: '17:00',
      breakDuration: 60,
    });

    const result = await sut.execute({
      id: schedule.id.toString(),
      mondayStart: '09:00',
      mondayEnd: '18:00',
    });

    expect(result.workSchedule.mondayStart).toBe('09:00');
    expect(result.workSchedule.mondayEnd).toBe('18:00');
  });

  it('should deactivate work schedule', async () => {
    const schedule = await workSchedulesRepository.create({
      name: 'Schedule',
      mondayStart: '08:00',
      mondayEnd: '17:00',
      breakDuration: 60,
    });

    const result = await sut.execute({
      id: schedule.id.toString(),
      isActive: false,
    });

    expect(result.workSchedule.isActive).toBe(false);
  });

  it('should throw error if schedule not found', async () => {
    await expect(
      sut.execute({
        id: new UniqueEntityID().toString(),
        name: 'Updated Name',
      }),
    ).rejects.toThrow('Work schedule not found');
  });

  it('should not allow duplicate name', async () => {
    await workSchedulesRepository.create({
      name: 'Schedule A',
      mondayStart: '08:00',
      mondayEnd: '17:00',
      breakDuration: 60,
    });

    const scheduleB = await workSchedulesRepository.create({
      name: 'Schedule B',
      mondayStart: '09:00',
      mondayEnd: '18:00',
      breakDuration: 60,
    });

    await expect(
      sut.execute({
        id: scheduleB.id.toString(),
        name: 'Schedule A',
      }),
    ).rejects.toThrow('Work schedule with this name already exists');
  });
});
