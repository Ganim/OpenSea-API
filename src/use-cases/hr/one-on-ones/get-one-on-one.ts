import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OneOnOneActionItem } from '@/entities/hr/one-on-one-action-item';
import type { OneOnOneMeeting } from '@/entities/hr/one-on-one-meeting';
import type { OneOnOneTalkingPoint } from '@/entities/hr/one-on-one-talking-point';
import type { OneOnOneActionItemsRepository } from '@/repositories/hr/one-on-one-action-items-repository';
import type { OneOnOneMeetingsRepository } from '@/repositories/hr/one-on-one-meetings-repository';
import type { OneOnOneTalkingPointsRepository } from '@/repositories/hr/one-on-one-talking-points-repository';

export interface GetOneOnOneRequest {
  tenantId: string;
  meetingId: string;
  /** Employee ID of the user requesting the resource. */
  viewerEmployeeId?: string;
  /** When true, the privacy filter is bypassed (admins, HR with .admin perm). */
  canSeeAllPrivateNotes?: boolean;
}

export interface GetOneOnOneResponse {
  meeting: OneOnOneMeeting;
  talkingPoints: OneOnOneTalkingPoint[];
  actionItems: OneOnOneActionItem[];
  viewerIsManager: boolean;
  viewerIsReport: boolean;
}

export class GetOneOnOneUseCase {
  constructor(
    private oneOnOneMeetingsRepository: OneOnOneMeetingsRepository,
    private talkingPointsRepository: OneOnOneTalkingPointsRepository,
    private actionItemsRepository: OneOnOneActionItemsRepository,
  ) {}

  async execute(request: GetOneOnOneRequest): Promise<GetOneOnOneResponse> {
    const {
      tenantId,
      meetingId,
      viewerEmployeeId,
      canSeeAllPrivateNotes = false,
    } = request;

    const meeting = await this.oneOnOneMeetingsRepository.findById(
      new UniqueEntityID(meetingId),
      tenantId,
    );

    if (!meeting) {
      throw new ResourceNotFoundError('OneOnOneMeeting');
    }

    const viewerEmployeeIdVO = viewerEmployeeId
      ? new UniqueEntityID(viewerEmployeeId)
      : null;

    const isParticipant = viewerEmployeeIdVO
      ? meeting.isParticipant(viewerEmployeeIdVO)
      : false;

    if (!isParticipant && !canSeeAllPrivateNotes) {
      throw new ForbiddenError(
        'Apenas participantes da reunião 1:1 podem acessá-la',
      );
    }

    const viewerIsManager = canSeeAllPrivateNotes
      ? true
      : viewerEmployeeIdVO
        ? meeting.isManager(viewerEmployeeIdVO)
        : false;

    const viewerIsReport = canSeeAllPrivateNotes
      ? true
      : viewerEmployeeIdVO
        ? meeting.isReport(viewerEmployeeIdVO)
        : false;

    const [talkingPoints, actionItems] = await Promise.all([
      this.talkingPointsRepository.findManyByMeeting(meeting.id),
      this.actionItemsRepository.findManyByMeeting(meeting.id),
    ]);

    return {
      meeting,
      talkingPoints,
      actionItems,
      viewerIsManager,
      viewerIsReport,
    };
  }
}
