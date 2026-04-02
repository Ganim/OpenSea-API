import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Interview } from '@/entities/hr/interview';
import type {
  CreateInterviewSchema,
  FindInterviewFilters,
  InterviewsRepository,
  UpdateInterviewSchema,
} from '../interviews-repository';

export class InMemoryInterviewsRepository implements InterviewsRepository {
  public items: Interview[] = [];

  async create(data: CreateInterviewSchema): Promise<Interview> {
    const interview = Interview.create({
      tenantId: new UniqueEntityID(data.tenantId),
      applicationId: new UniqueEntityID(data.applicationId),
      interviewStageId: new UniqueEntityID(data.interviewStageId),
      interviewerId: new UniqueEntityID(data.interviewerId),
      scheduledAt: data.scheduledAt,
      duration: data.duration ?? 60,
      location: data.location,
      meetingUrl: data.meetingUrl,
      status: 'SCHEDULED',
    });

    this.items.push(interview);
    return interview;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Interview | null> {
    return (
      this.items.find(
        (interview) =>
          interview.id.equals(id) && interview.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findManyByApplication(
    applicationId: string,
    tenantId: string,
  ): Promise<Interview[]> {
    return this.items
      .filter(
        (interview) =>
          interview.applicationId.toString() === applicationId &&
          interview.tenantId.toString() === tenantId,
      )
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }

  async findMany(
    tenantId: string,
    filters?: FindInterviewFilters,
  ): Promise<{ interviews: Interview[]; total: number }> {
    let filtered = this.items.filter(
      (interview) => interview.tenantId.toString() === tenantId,
    );

    if (filters?.applicationId) {
      filtered = filtered.filter(
        (interview) =>
          interview.applicationId.toString() === filters.applicationId,
      );
    }
    if (filters?.interviewerId) {
      filtered = filtered.filter(
        (interview) =>
          interview.interviewerId.toString() === filters.interviewerId,
      );
    }
    if (filters?.status) {
      filtered = filtered.filter(
        (interview) => interview.status === filters.status,
      );
    }

    const total = filtered.length;
    const sorted = filtered.sort(
      (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime(),
    );
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);

    return {
      interviews: sorted.slice((page - 1) * perPage, page * perPage),
      total,
    };
  }

  async update(data: UpdateInterviewSchema): Promise<Interview | null> {
    const index = this.items.findIndex((interview) =>
      interview.id.equals(data.id),
    );
    if (index === -1) return null;

    const interview = this.items[index];

    if (data.status !== undefined) {
      interview.props.status = data.status;
      interview.props.updatedAt = new Date();
    }
    if (data.feedback !== undefined) {
      interview.props.feedback = data.feedback;
      interview.props.updatedAt = new Date();
    }
    if (data.rating !== undefined) {
      interview.props.rating = data.rating;
      interview.props.updatedAt = new Date();
    }
    if (data.recommendation !== undefined) {
      interview.props.recommendation = data.recommendation;
      interview.props.updatedAt = new Date();
    }
    if (data.completedAt !== undefined) {
      interview.props.completedAt = data.completedAt;
      interview.props.updatedAt = new Date();
    }

    return interview;
  }
}
