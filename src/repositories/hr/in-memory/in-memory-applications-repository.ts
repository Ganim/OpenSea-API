import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Application } from '@/entities/hr/application';
import type {
  ApplicationsRepository,
  CreateApplicationSchema,
  FindApplicationFilters,
  UpdateApplicationSchema,
} from '../applications-repository';

export class InMemoryApplicationsRepository
  implements ApplicationsRepository
{
  public items: Application[] = [];

  async create(data: CreateApplicationSchema): Promise<Application> {
    const application = Application.create({
      tenantId: new UniqueEntityID(data.tenantId),
      jobPostingId: new UniqueEntityID(data.jobPostingId),
      candidateId: new UniqueEntityID(data.candidateId),
      status: data.status ?? 'APPLIED',
      currentStageId: data.currentStageId
        ? new UniqueEntityID(data.currentStageId)
        : undefined,
    });

    this.items.push(application);
    return application;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Application | null> {
    return (
      this.items.find(
        (application) =>
          application.id.equals(id) &&
          application.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findByJobAndCandidate(
    jobPostingId: string,
    candidateId: string,
    tenantId: string,
  ): Promise<Application | null> {
    return (
      this.items.find(
        (application) =>
          application.jobPostingId.toString() === jobPostingId &&
          application.candidateId.toString() === candidateId &&
          application.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindApplicationFilters,
  ): Promise<{ applications: Application[]; total: number }> {
    let filtered = this.items.filter(
      (application) => application.tenantId.toString() === tenantId,
    );

    if (filters?.jobPostingId) {
      filtered = filtered.filter(
        (application) =>
          application.jobPostingId.toString() === filters.jobPostingId,
      );
    }
    if (filters?.candidateId) {
      filtered = filtered.filter(
        (application) =>
          application.candidateId.toString() === filters.candidateId,
      );
    }
    if (filters?.status) {
      filtered = filtered.filter(
        (application) => application.status === filters.status,
      );
    }

    const total = filtered.length;
    const sorted = filtered.sort(
      (a, b) => b.appliedAt.getTime() - a.appliedAt.getTime(),
    );
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);

    return {
      applications: sorted.slice((page - 1) * perPage, page * perPage),
      total,
    };
  }

  async update(data: UpdateApplicationSchema): Promise<Application | null> {
    const index = this.items.findIndex((application) =>
      application.id.equals(data.id),
    );
    if (index === -1) return null;

    const application = this.items[index];

    if (data.status !== undefined) {
      application.updateStatus(data.status);
    }
    if (data.currentStageId !== undefined) {
      application.props.currentStageId = new UniqueEntityID(
        data.currentStageId,
      );
      application.props.updatedAt = new Date();
    }
    if (data.rejectedAt !== undefined) {
      application.props.rejectedAt = data.rejectedAt;
      application.props.updatedAt = new Date();
    }
    if (data.rejectionReason !== undefined) {
      application.props.rejectionReason = data.rejectionReason;
      application.props.updatedAt = new Date();
    }
    if (data.hiredAt !== undefined) {
      application.props.hiredAt = data.hiredAt;
      application.props.updatedAt = new Date();
    }
    if (data.rating !== undefined) {
      application.setRating(data.rating);
    }

    return application;
  }

  async countByJobPosting(
    jobPostingId: string,
    tenantId: string,
  ): Promise<number> {
    return this.items.filter(
      (application) =>
        application.jobPostingId.toString() === jobPostingId &&
        application.tenantId.toString() === tenantId,
    ).length;
  }
}
