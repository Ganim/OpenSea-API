import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Interview as PrismaInterview } from '@prisma/generated/client.js';

export function mapInterviewPrismaToDomain(interview: PrismaInterview) {
  return {
    tenantId: new UniqueEntityID(interview.tenantId),
    applicationId: new UniqueEntityID(interview.applicationId),
    interviewStageId: new UniqueEntityID(interview.interviewStageId),
    interviewerId: new UniqueEntityID(interview.interviewerId),
    scheduledAt: interview.scheduledAt,
    duration: interview.duration,
    location: interview.location ?? undefined,
    meetingUrl: interview.meetingUrl ?? undefined,
    status: interview.status,
    feedback: interview.feedback ?? undefined,
    rating: interview.rating ?? undefined,
    recommendation: interview.recommendation ?? undefined,
    completedAt: interview.completedAt ?? undefined,
    createdAt: interview.createdAt,
    updatedAt: interview.updatedAt,
  };
}
