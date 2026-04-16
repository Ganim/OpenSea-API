import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOneOnOneActionItemsRepository } from '@/repositories/hr/in-memory/in-memory-one-on-one-action-items-repository';
import { InMemoryOneOnOneMeetingsRepository } from '@/repositories/hr/in-memory/in-memory-one-on-one-meetings-repository';
import { InMemoryOneOnOneTalkingPointsRepository } from '@/repositories/hr/in-memory/in-memory-one-on-one-talking-points-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetOneOnOneUseCase } from './get-one-on-one';

let oneOnOneMeetingsRepository: InMemoryOneOnOneMeetingsRepository;
let talkingPointsRepository: InMemoryOneOnOneTalkingPointsRepository;
let actionItemsRepository: InMemoryOneOnOneActionItemsRepository;
let sut: GetOneOnOneUseCase;
const tenantId = new UniqueEntityID().toString();
const managerId = new UniqueEntityID();
const reportId = new UniqueEntityID();

describe('Get One-on-One Use Case', () => {
  beforeEach(() => {
    oneOnOneMeetingsRepository = new InMemoryOneOnOneMeetingsRepository();
    talkingPointsRepository = new InMemoryOneOnOneTalkingPointsRepository();
    actionItemsRepository = new InMemoryOneOnOneActionItemsRepository();
    sut = new GetOneOnOneUseCase(
      oneOnOneMeetingsRepository,
      talkingPointsRepository,
      actionItemsRepository,
    );
  });

  it('should return meeting with talking points and action items', async () => {
    const meeting = await oneOnOneMeetingsRepository.create({
      tenantId,
      managerId,
      reportId,
      scheduledAt: new Date('2025-09-01'),
      durationMinutes: 30,
    });

    await talkingPointsRepository.create({
      meetingId: meeting.id,
      addedByEmployeeId: managerId,
      content: 'Career growth',
    });

    await actionItemsRepository.create({
      meetingId: meeting.id,
      ownerId: reportId,
      content: 'Submit roadmap draft',
    });

    const result = await sut.execute({
      tenantId,
      meetingId: meeting.id.toString(),
      viewerEmployeeId: managerId.toString(),
    });

    expect(result.talkingPoints).toHaveLength(1);
    expect(result.actionItems).toHaveLength(1);
    expect(result.viewerIsManager).toBe(true);
    expect(result.viewerIsReport).toBe(false);
  });

  it('should reject viewer that is not a participant', async () => {
    const meeting = await oneOnOneMeetingsRepository.create({
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
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should allow access when canSeeAllPrivateNotes is true', async () => {
    const meeting = await oneOnOneMeetingsRepository.create({
      tenantId,
      managerId,
      reportId,
      scheduledAt: new Date(),
      durationMinutes: 30,
    });

    const result = await sut.execute({
      tenantId,
      meetingId: meeting.id.toString(),
      canSeeAllPrivateNotes: true,
    });

    expect(result.viewerIsManager).toBe(true);
    expect(result.viewerIsReport).toBe(true);
  });

  it('should throw when meeting does not exist', async () => {
    await expect(
      sut.execute({
        tenantId,
        meetingId: new UniqueEntityID().toString(),
        viewerEmployeeId: managerId.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
