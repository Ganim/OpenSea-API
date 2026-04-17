import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Interview } from '@/entities/hr/interview';

export interface CreateInterviewSchema {
  tenantId: string;
  applicationId: string;
  interviewStageId: string;
  interviewerId: string;
  scheduledAt: Date;
  duration?: number;
  location?: string;
  meetingUrl?: string;
}

export interface UpdateInterviewSchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
  status?: string;
  feedback?: string;
  rating?: number;
  recommendation?: string;
  completedAt?: Date;
}

export interface FindInterviewFilters {
  applicationId?: string;
  interviewerId?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface InterviewsRepository {
  create(data: CreateInterviewSchema): Promise<Interview>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Interview | null>;
  findManyByApplication(
    applicationId: string,
    tenantId: string,
  ): Promise<Interview[]>;
  findMany(
    tenantId: string,
    filters?: FindInterviewFilters,
  ): Promise<{ interviews: Interview[]; total: number }>;
  update(data: UpdateInterviewSchema): Promise<Interview | null>;
}
