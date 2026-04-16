import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOneOnOneMeetingsRepository } from '@/repositories/hr/in-memory/in-memory-one-on-one-meetings-repository';
import { InMemoryOneOnOneTalkingPointsRepository } from '@/repositories/hr/in-memory/in-memory-one-on-one-talking-points-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AddTalkingPointUseCase } from './add-talking-point';
import { DeleteTalkingPointUseCase } from './delete-talking-point';
import { UpdateTalkingPointUseCase } from './update-talking-point';

let meetingsRepository: InMemoryOneOnOneMeetingsRepository;
let talkingPointsRepository: InMemoryOneOnOneTalkingPointsRepository;
let addUseCase: AddTalkingPointUseCase;
let updateUseCase: UpdateTalkingPointUseCase;
let deleteUseCase: DeleteTalkingPointUseCase;
const tenantId = new UniqueEntityID().toString();
const managerId = new UniqueEntityID();
const reportId = new UniqueEntityID();

describe('Talking Point Use Cases', () => {
  beforeEach(() => {
    meetingsRepository = new InMemoryOneOnOneMeetingsRepository();
    talkingPointsRepository = new InMemoryOneOnOneTalkingPointsRepository();
    addUseCase = new AddTalkingPointUseCase(
      meetingsRepository,
      talkingPointsRepository,
    );
    updateUseCase = new UpdateTalkingPointUseCase(
      meetingsRepository,
      talkingPointsRepository,
    );
    deleteUseCase = new DeleteTalkingPointUseCase(talkingPointsRepository);
  });

  it('should add talking point as participant with sequential position', async () => {
    const meeting = await meetingsRepository.create({
      tenantId,
      managerId,
      reportId,
      scheduledAt: new Date(),
      durationMinutes: 30,
    });

    const first = await addUseCase.execute({
      tenantId,
      meetingId: meeting.id.toString(),
      authorEmployeeId: managerId.toString(),
      content: 'Discuss roadmap',
    });

    const second = await addUseCase.execute({
      tenantId,
      meetingId: meeting.id.toString(),
      authorEmployeeId: reportId.toString(),
      content: 'Discuss feedback',
    });

    expect(first.talkingPoint.position).toBe(0);
    expect(second.talkingPoint.position).toBe(1);
  });

  it('should reject add when not a participant', async () => {
    const meeting = await meetingsRepository.create({
      tenantId,
      managerId,
      reportId,
      scheduledAt: new Date(),
      durationMinutes: 30,
    });

    await expect(
      addUseCase.execute({
        tenantId,
        meetingId: meeting.id.toString(),
        authorEmployeeId: new UniqueEntityID().toString(),
        content: 'Outsider note',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should toggle resolved by any participant', async () => {
    const meeting = await meetingsRepository.create({
      tenantId,
      managerId,
      reportId,
      scheduledAt: new Date(),
      durationMinutes: 30,
    });

    const { talkingPoint } = await addUseCase.execute({
      tenantId,
      meetingId: meeting.id.toString(),
      authorEmployeeId: managerId.toString(),
      content: 'Original',
    });

    const { talkingPoint: updated } = await updateUseCase.execute({
      tenantId,
      talkingPointId: talkingPoint.id.toString(),
      viewerEmployeeId: reportId.toString(),
      isResolved: true,
    });

    expect(updated.isResolved).toBe(true);
  });

  it('should reject content edit by non author', async () => {
    const meeting = await meetingsRepository.create({
      tenantId,
      managerId,
      reportId,
      scheduledAt: new Date(),
      durationMinutes: 30,
    });

    const { talkingPoint } = await addUseCase.execute({
      tenantId,
      meetingId: meeting.id.toString(),
      authorEmployeeId: managerId.toString(),
      content: 'Original',
    });

    await expect(
      updateUseCase.execute({
        tenantId,
        talkingPointId: talkingPoint.id.toString(),
        viewerEmployeeId: reportId.toString(),
        content: 'Edited by report',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should let only author delete a talking point', async () => {
    const meeting = await meetingsRepository.create({
      tenantId,
      managerId,
      reportId,
      scheduledAt: new Date(),
      durationMinutes: 30,
    });

    const { talkingPoint } = await addUseCase.execute({
      tenantId,
      meetingId: meeting.id.toString(),
      authorEmployeeId: managerId.toString(),
      content: 'Will be deleted',
    });

    await expect(
      deleteUseCase.execute({
        talkingPointId: talkingPoint.id.toString(),
        viewerEmployeeId: reportId.toString(),
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    await deleteUseCase.execute({
      talkingPointId: talkingPoint.id.toString(),
      viewerEmployeeId: managerId.toString(),
    });

    const stillThere = await talkingPointsRepository.findById(talkingPoint.id);
    expect(stillThere).toBeNull();
  });

  it('should throw ResourceNotFoundError when talking point missing', async () => {
    await expect(
      deleteUseCase.execute({
        talkingPointId: new UniqueEntityID().toString(),
        viewerEmployeeId: managerId.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
