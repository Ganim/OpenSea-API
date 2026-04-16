import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OneOnOneTalkingPoint } from '@/entities/hr/one-on-one-talking-point';
import type { OneOnOneMeetingsRepository } from '@/repositories/hr/one-on-one-meetings-repository';
import type { OneOnOneTalkingPointsRepository } from '@/repositories/hr/one-on-one-talking-points-repository';

export interface AddTalkingPointRequest {
  tenantId: string;
  meetingId: string;
  authorEmployeeId: string;
  content: string;
}

export interface AddTalkingPointResponse {
  talkingPoint: OneOnOneTalkingPoint;
}

export class AddTalkingPointUseCase {
  constructor(
    private oneOnOneMeetingsRepository: OneOnOneMeetingsRepository,
    private talkingPointsRepository: OneOnOneTalkingPointsRepository,
  ) {}

  async execute(
    request: AddTalkingPointRequest,
  ): Promise<AddTalkingPointResponse> {
    const { tenantId, meetingId, authorEmployeeId, content } = request;

    const meeting = await this.oneOnOneMeetingsRepository.findById(
      new UniqueEntityID(meetingId),
      tenantId,
    );

    if (!meeting) {
      throw new ResourceNotFoundError('OneOnOneMeeting');
    }

    const authorIdVO = new UniqueEntityID(authorEmployeeId);
    if (!meeting.isParticipant(authorIdVO)) {
      throw new ForbiddenError(
        'Apenas participantes da reunião 1:1 podem adicionar tópicos',
      );
    }

    const talkingPoint = await this.talkingPointsRepository.create({
      meetingId: meeting.id,
      addedByEmployeeId: authorIdVO,
      content,
    });

    return { talkingPoint };
  }
}
