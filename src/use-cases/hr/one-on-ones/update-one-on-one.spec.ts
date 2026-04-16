import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOneOnOneMeetingsRepository } from '@/repositories/hr/in-memory/in-memory-one-on-one-meetings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateOneOnOneUseCase } from './update-one-on-one';

let meetingsRepository: InMemoryOneOnOneMeetingsRepository;
let sut: UpdateOneOnOneUseCase;
const tenantId = new UniqueEntityID().toString();
const managerId = new UniqueEntityID();
const reportId = new UniqueEntityID();

describe('Update One-on-One Use Case', () => {
  beforeEach(() => {
    meetingsRepository = new InMemoryOneOnOneMeetingsRepository();
    sut = new UpdateOneOnOneUseCase(meetingsRepository);
  });

  it('should update scheduledAt and shared notes by participant', async () => {
    const meeting = await meetingsRepository.create({
      tenantId,
      managerId,
      reportId,
      scheduledAt: new Date('2025-09-01'),
      durationMinutes: 30,
    });

    const newDate = new Date('2025-09-08');
    const { meeting: updated } = await sut.execute({
      tenantId,
      meetingId: meeting.id.toString(),
      viewerEmployeeId: reportId.toString(),
      scheduledAt: newDate,
      sharedNotes: 'Aligning on Q4 OKRs',
    });

    expect(updated.scheduledAt.toISOString()).toBe(newDate.toISOString());
    expect(updated.sharedNotes).toBe('Aligning on Q4 OKRs');
  });

  it('should set manager-only notes when manager updates', async () => {
    const meeting = await meetingsRepository.create({
      tenantId,
      managerId,
      reportId,
      scheduledAt: new Date(),
      durationMinutes: 30,
    });

    const { meeting: updated } = await sut.execute({
      tenantId,
      meetingId: meeting.id.toString(),
      viewerEmployeeId: managerId.toString(),
      privateNotes: 'Considering promotion',
    });

    expect(updated.privateNotesManager).toBe('Considering promotion');
    expect(updated.privateNotesReport).toBeUndefined();
  });

  it('should set report-only notes when report updates', async () => {
    const meeting = await meetingsRepository.create({
      tenantId,
      managerId,
      reportId,
      scheduledAt: new Date(),
      durationMinutes: 30,
    });

    const { meeting: updated } = await sut.execute({
      tenantId,
      meetingId: meeting.id.toString(),
      viewerEmployeeId: reportId.toString(),
      privateNotes: 'Thinking about new project',
    });

    expect(updated.privateNotesReport).toBe('Thinking about new project');
    expect(updated.privateNotesManager).toBeUndefined();
  });

  it('should mark as cancelled with reason', async () => {
    const meeting = await meetingsRepository.create({
      tenantId,
      managerId,
      reportId,
      scheduledAt: new Date(),
      durationMinutes: 30,
    });

    const { meeting: updated } = await sut.execute({
      tenantId,
      meetingId: meeting.id.toString(),
      viewerEmployeeId: managerId.toString(),
      status: 'CANCELLED',
      cancelledReason: 'Conflict with travel',
    });

    expect(updated.status).toBe('CANCELLED');
    expect(updated.cancelledReason).toBe('Conflict with travel');
  });

  it('should reject non-participant', async () => {
    const meeting = await meetingsRepository.create({
      tenantId,
      managerId,
      reportId,
      scheduledAt: new Date(),
      durationMinutes: 30,
    });

    await expect(
      sut.execute({
        tenantId,
        meetingId: meeting.id.toString(),
        viewerEmployeeId: new UniqueEntityID().toString(),
        sharedNotes: 'Hacking attempt',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw when meeting not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        meetingId: new UniqueEntityID().toString(),
        viewerEmployeeId: managerId.toString(),
        sharedNotes: 'whatever',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
