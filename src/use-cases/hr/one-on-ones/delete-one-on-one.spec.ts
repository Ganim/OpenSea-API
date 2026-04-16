import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOneOnOneMeetingsRepository } from '@/repositories/hr/in-memory/in-memory-one-on-one-meetings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteOneOnOneUseCase } from './delete-one-on-one';

let meetingsRepository: InMemoryOneOnOneMeetingsRepository;
let sut: DeleteOneOnOneUseCase;
const tenantId = new UniqueEntityID().toString();
const managerId = new UniqueEntityID();
const reportId = new UniqueEntityID();

describe('Delete One-on-One Use Case', () => {
  beforeEach(() => {
    meetingsRepository = new InMemoryOneOnOneMeetingsRepository();
    sut = new DeleteOneOnOneUseCase(meetingsRepository);
  });

  it('should soft delete meeting when manager invokes', async () => {
    const meeting = await meetingsRepository.create({
      tenantId,
      managerId,
      reportId,
      scheduledAt: new Date(),
      durationMinutes: 30,
    });

    await sut.execute({
      tenantId,
      meetingId: meeting.id.toString(),
      viewerEmployeeId: managerId.toString(),
    });

    const stillVisible = await meetingsRepository.findById(
      meeting.id,
      tenantId,
    );
    expect(stillVisible).toBeNull();
  });

  it('should reject when report tries to delete without admin', async () => {
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
        viewerEmployeeId: reportId.toString(),
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should allow delete with canAdmin even for non manager', async () => {
    const meeting = await meetingsRepository.create({
      tenantId,
      managerId,
      reportId,
      scheduledAt: new Date(),
      durationMinutes: 30,
    });

    await sut.execute({
      tenantId,
      meetingId: meeting.id.toString(),
      viewerEmployeeId: new UniqueEntityID().toString(),
      canAdmin: true,
    });

    const stillVisible = await meetingsRepository.findById(
      meeting.id,
      tenantId,
    );
    expect(stillVisible).toBeNull();
  });

  it('should throw when meeting missing', async () => {
    await expect(
      sut.execute({
        tenantId,
        meetingId: new UniqueEntityID().toString(),
        viewerEmployeeId: managerId.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
