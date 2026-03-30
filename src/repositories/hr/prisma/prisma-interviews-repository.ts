import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Interview } from '@/entities/hr/interview';
import { prisma } from '@/lib/prisma';
import { mapInterviewPrismaToDomain } from '@/mappers/hr/interview';
import type {
  CreateInterviewSchema,
  FindInterviewFilters,
  InterviewsRepository,
  UpdateInterviewSchema,
} from '../interviews-repository';

export class PrismaInterviewsRepository implements InterviewsRepository {
  async create(data: CreateInterviewSchema): Promise<Interview> {
    const interviewData = await prisma.interview.create({
      data: {
        tenantId: data.tenantId,
        applicationId: data.applicationId,
        interviewStageId: data.interviewStageId,
        interviewerId: data.interviewerId,
        scheduledAt: data.scheduledAt,
        duration: data.duration ?? 60,
        location: data.location,
        meetingUrl: data.meetingUrl,
        status: 'SCHEDULED',
      },
    });

    return Interview.create(
      mapInterviewPrismaToDomain(interviewData),
      new UniqueEntityID(interviewData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Interview | null> {
    const interviewData = await prisma.interview.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!interviewData) return null;

    return Interview.create(
      mapInterviewPrismaToDomain(interviewData),
      new UniqueEntityID(interviewData.id),
    );
  }

  async findManyByApplication(
    applicationId: string,
    tenantId: string,
  ): Promise<Interview[]> {
    const interviewsData = await prisma.interview.findMany({
      where: { applicationId, tenantId },
      orderBy: { scheduledAt: 'asc' },
    });

    return interviewsData.map((interview) =>
      Interview.create(
        mapInterviewPrismaToDomain(interview),
        new UniqueEntityID(interview.id),
      ),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindInterviewFilters,
  ): Promise<{ interviews: Interview[]; total: number }> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      applicationId: filters?.applicationId,
      interviewerId: filters?.interviewerId,
      status: filters?.status as 'SCHEDULED' | undefined,
    };

    const [interviewsData, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: perPage,
      }),
      prisma.interview.count({ where }),
    ]);

    const interviews = interviewsData.map((interview) =>
      Interview.create(
        mapInterviewPrismaToDomain(interview),
        new UniqueEntityID(interview.id),
      ),
    );

    return { interviews, total };
  }

  async update(data: UpdateInterviewSchema): Promise<Interview | null> {
    const existingInterview = await prisma.interview.findUnique({
      where: { id: data.id.toString() },
    });

    if (!existingInterview) return null;

    const interviewData = await prisma.interview.update({
      where: { id: data.id.toString() },
      data: {
        status: data.status as 'SCHEDULED' | undefined,
        feedback: data.feedback,
        rating: data.rating,
        recommendation: data.recommendation as 'ADVANCE' | undefined,
        completedAt: data.completedAt,
      },
    });

    return Interview.create(
      mapInterviewPrismaToDomain(interviewData),
      new UniqueEntityID(interviewData.id),
    );
  }
}
