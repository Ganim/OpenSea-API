import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  OneOnOneMeeting,
  OneOnOneStatus,
} from '@/entities/hr/one-on-one-meeting';
import type { OneOnOneMeetingsRepository } from '@/repositories/hr/one-on-one-meetings-repository';

export interface UpdateOneOnOneRequest {
  tenantId: string;
  meetingId: string;
  viewerEmployeeId: string;
  scheduledAt?: Date;
  durationMinutes?: number;
  status?: OneOnOneStatus;
  sharedNotes?: string | null;
  privateNotes?: string | null;
  cancelledReason?: string | null;
}

export interface UpdateOneOnOneResponse {
  meeting: OneOnOneMeeting;
}

export class UpdateOneOnOneUseCase {
  constructor(private oneOnOneMeetingsRepository: OneOnOneMeetingsRepository) {}

  async execute(
    request: UpdateOneOnOneRequest,
  ): Promise<UpdateOneOnOneResponse> {
    const {
      tenantId,
      meetingId,
      viewerEmployeeId,
      scheduledAt,
      durationMinutes,
      status,
      sharedNotes,
      privateNotes,
      cancelledReason,
    } = request;

    const meeting = await this.oneOnOneMeetingsRepository.findById(
      new UniqueEntityID(meetingId),
      tenantId,
    );

    if (!meeting) {
      throw new ResourceNotFoundError('OneOnOneMeeting');
    }

    const viewerEmployeeIdVO = new UniqueEntityID(viewerEmployeeId);
    if (!meeting.isParticipant(viewerEmployeeIdVO)) {
      throw new ForbiddenError(
        'Apenas participantes da reunião 1:1 podem atualizá-la',
      );
    }

    if (status === 'CANCELLED') {
      meeting.cancel(cancelledReason ?? undefined);
    } else if (status === 'COMPLETED') {
      meeting.markCompleted();
    } else if (status === 'SCHEDULED') {
      meeting.props.status = 'SCHEDULED';
    }

    if (scheduledAt) {
      meeting.scheduledAt = scheduledAt;
    }

    if (durationMinutes !== undefined) {
      if (durationMinutes <= 0) {
        throw new BadRequestError('Duração deve ser positiva');
      }
      meeting.durationMinutes = durationMinutes;
    }

    if (sharedNotes !== undefined) {
      meeting.setSharedNotes(sharedNotes ?? undefined);
    }

    if (privateNotes !== undefined) {
      if (meeting.isManager(viewerEmployeeIdVO)) {
        meeting.setManagerNotes(privateNotes ?? undefined);
      } else {
        meeting.setReportNotes(privateNotes ?? undefined);
      }
    }

    await this.oneOnOneMeetingsRepository.save(meeting);

    return { meeting };
  }
}
