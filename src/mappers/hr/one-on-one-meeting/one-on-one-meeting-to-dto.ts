import type {
  OneOnOneMeeting,
  OneOnOneStatus,
} from '@/entities/hr/one-on-one-meeting';

export interface OneOnOneMeetingDTO {
  id: string;
  managerId: string;
  reportId: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: OneOnOneStatus;
  privateNotesManager: string | null;
  privateNotesReport: string | null;
  sharedNotes: string | null;
  cancelledReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OneOnOneMeetingPresentationOptions {
  /** When viewer is not the manager, manager-only notes are stripped. */
  viewerIsManager: boolean;
  /** When viewer is not the report, report-only notes are stripped. */
  viewerIsReport: boolean;
}

export function oneOnOneMeetingToDTO(
  meeting: OneOnOneMeeting,
  options: OneOnOneMeetingPresentationOptions,
): OneOnOneMeetingDTO {
  return {
    id: meeting.id.toString(),
    managerId: meeting.managerId.toString(),
    reportId: meeting.reportId.toString(),
    scheduledAt: meeting.scheduledAt,
    durationMinutes: meeting.durationMinutes,
    status: meeting.status,
    privateNotesManager: options.viewerIsManager
      ? (meeting.privateNotesManager ?? null)
      : null,
    privateNotesReport: options.viewerIsReport
      ? (meeting.privateNotesReport ?? null)
      : null,
    sharedNotes: meeting.sharedNotes ?? null,
    cancelledReason: meeting.cancelledReason ?? null,
    createdAt: meeting.createdAt,
    updatedAt: meeting.updatedAt,
  };
}
