import type { Interview } from '@/entities/hr/interview';

export interface InterviewDTO {
  id: string;
  applicationId: string;
  interviewStageId: string;
  interviewerId: string;
  scheduledAt: string;
  duration: number;
  location: string | null;
  meetingUrl: string | null;
  status: string;
  feedback: string | null;
  rating: number | null;
  recommendation: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function interviewToDTO(interview: Interview): InterviewDTO {
  return {
    id: interview.id.toString(),
    applicationId: interview.applicationId.toString(),
    interviewStageId: interview.interviewStageId.toString(),
    interviewerId: interview.interviewerId.toString(),
    scheduledAt: interview.scheduledAt.toISOString(),
    duration: interview.duration,
    location: interview.location ?? null,
    meetingUrl: interview.meetingUrl ?? null,
    status: interview.status,
    feedback: interview.feedback ?? null,
    rating: interview.rating ?? null,
    recommendation: interview.recommendation ?? null,
    completedAt: interview.completedAt?.toISOString() ?? null,
    createdAt: interview.createdAt.toISOString(),
    updatedAt: interview.updatedAt.toISOString(),
  };
}
