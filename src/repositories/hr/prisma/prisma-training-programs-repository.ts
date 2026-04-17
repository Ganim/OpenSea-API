import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TrainingProgram } from '@/entities/hr/training-program';
import { prisma } from '@/lib/prisma';
import { mapTrainingProgramPrismaToDomain } from '@/mappers/hr/training-program';
import type {
  CreateTrainingProgramSchema,
  FindTrainingProgramFilters,
  TrainingProgramsRepository,
  UpdateTrainingProgramSchema,
} from '../training-programs-repository';

export class PrismaTrainingProgramsRepository
  implements TrainingProgramsRepository
{
  async create(data: CreateTrainingProgramSchema): Promise<TrainingProgram> {
    const programData = await prisma.trainingProgram.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        category: data.category,
        format: data.format,
        durationHours: data.durationHours,
        instructor: data.instructor,
        maxParticipants: data.maxParticipants,
        isActive: data.isActive ?? true,
        isMandatory: data.isMandatory ?? false,
        validityMonths: data.validityMonths,
      },
    });

    return TrainingProgram.create(
      mapTrainingProgramPrismaToDomain(programData),
      new UniqueEntityID(programData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<TrainingProgram | null> {
    const programData = await prisma.trainingProgram.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    if (!programData) return null;

    return TrainingProgram.create(
      mapTrainingProgramPrismaToDomain(programData),
      new UniqueEntityID(programData.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindTrainingProgramFilters,
  ): Promise<{ trainingPrograms: TrainingProgram[]; total: number }> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      deletedAt: null,
      category: filters?.category,
      format: filters?.format,
      isActive: filters?.isActive,
      isMandatory: filters?.isMandatory,
      ...(filters?.search
        ? {
            name: {
              contains: filters.search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [programsData, total] = await Promise.all([
      prisma.trainingProgram.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.trainingProgram.count({ where }),
    ]);

    const trainingPrograms = programsData.map((program) =>
      TrainingProgram.create(
        mapTrainingProgramPrismaToDomain(program),
        new UniqueEntityID(program.id),
      ),
    );

    return { trainingPrograms, total };
  }

  async update(
    data: UpdateTrainingProgramSchema,
  ): Promise<TrainingProgram | null> {
    const existingProgram = await prisma.trainingProgram.findUnique({
      where: { id: data.id.toString(), ...(data.tenantId && { tenantId: data.tenantId }), },
    });

    if (!existingProgram) return null;

    const programData = await prisma.trainingProgram.update({
      where: { id: data.id.toString(), ...(data.tenantId && { tenantId: data.tenantId }), },
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        format: data.format,
        durationHours: data.durationHours,
        instructor: data.instructor,
        maxParticipants: data.maxParticipants,
        isActive: data.isActive,
        isMandatory: data.isMandatory,
        validityMonths: data.validityMonths,
      },
    });

    return TrainingProgram.create(
      mapTrainingProgramPrismaToDomain(programData),
      new UniqueEntityID(programData.id),
    );
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.trainingProgram.update({
      where: { id: id.toString(), ...(tenantId && { tenantId }), },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
}
