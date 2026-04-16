import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OneOnOneTalkingPoint } from '@/entities/hr/one-on-one-talking-point';
import type { OneOnOneMeetingsRepository } from '@/repositories/hr/one-on-one-meetings-repository';
import type { OneOnOneTalkingPointsRepository } from '@/repositories/hr/one-on-one-talking-points-repository';

export interface UpdateTalkingPointRequest {
  tenantId: string;
  talkingPointId: string;
  viewerEmployeeId: string;
  content?: string;
  isResolved?: boolean;
}

export interface UpdateTalkingPointResponse {
  talkingPoint: OneOnOneTalkingPoint;
}

export class UpdateTalkingPointUseCase {
  constructor(
    private oneOnOneMeetingsRepository: OneOnOneMeetingsRepository,
    private talkingPointsRepository: OneOnOneTalkingPointsRepository,
  ) {}

  async execute(
    request: UpdateTalkingPointRequest,
  ): Promise<UpdateTalkingPointResponse> {
    const { tenantId, talkingPointId, viewerEmployeeId, content, isResolved } =
      request;

    const talkingPoint = await this.talkingPointsRepository.findById(
      new UniqueEntityID(talkingPointId),
    );

    if (!talkingPoint) {
      throw new ResourceNotFoundError('TalkingPoint');
    }

    const meeting = await this.oneOnOneMeetingsRepository.findById(
      talkingPoint.meetingId,
      tenantId,
    );

    if (!meeting) {
      throw new ResourceNotFoundError('OneOnOneMeeting');
    }

    const viewerIdVO = new UniqueEntityID(viewerEmployeeId);

    // Content edits: only the author may change.
    if (content !== undefined) {
      if (!talkingPoint.isAuthor(viewerIdVO)) {
        throw new ForbiddenError(
          'Apenas o autor pode editar o conteúdo do tópico',
        );
      }
      talkingPoint.content = content;
    }

    // Resolved toggle: any participant may toggle.
    if (isResolved !== undefined) {
      if (!meeting.isParticipant(viewerIdVO)) {
        throw new ForbiddenError(
          'Apenas participantes da reunião 1:1 podem marcar tópicos como resolvidos',
        );
      }
      talkingPoint.setResolved(isResolved);
    }

    await this.talkingPointsRepository.save(talkingPoint);

    return { talkingPoint };
  }
}
