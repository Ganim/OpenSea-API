import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { InterviewStage } from '@/entities/hr/interview-stage';

export interface CreateInterviewStageSchema {
  tenantId: string;
  jobPostingId: string;
  name: string;
  order: number;
  type?: string;
  description?: string;
}

export interface UpdateInterviewStageOrderSchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
  order: number;
}

export interface InterviewStagesRepository {
  create(data: CreateInterviewStageSchema): Promise<InterviewStage>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<InterviewStage | null>;
  findManyByJobPosting(
    jobPostingId: string,
    tenantId: string,
  ): Promise<InterviewStage[]>;
  updateOrder(stages: UpdateInterviewStageOrderSchema[]): Promise<void>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
  getMaxOrder(jobPostingId: string, tenantId: string): Promise<number>;
}
