import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TrainingProgram } from '@/entities/hr/training-program';
import type {
  CreateTrainingProgramSchema,
  FindTrainingProgramFilters,
  TrainingProgramsRepository,
  UpdateTrainingProgramSchema,
} from '../training-programs-repository';

export class InMemoryTrainingProgramsRepository
  implements TrainingProgramsRepository
{
  public items: TrainingProgram[] = [];

  async create(data: CreateTrainingProgramSchema): Promise<TrainingProgram> {
    const trainingProgram = TrainingProgram.create({
      tenantId: new UniqueEntityID(data.tenantId),
      name: data.name,
      description: data.description,
      category: data.category,
      format: data.format,
      durationHours: data.durationHours,
      instructor: data.instructor,
      maxParticipants: data.maxParticipants,
      isActive: data.isActive ?? true,
      isMandatory: data.isMandatory ?? false,
      isMandatoryForESocial: data.isMandatoryForESocial ?? false,
      validityMonths: data.validityMonths,
    });

    this.items.push(trainingProgram);
    return trainingProgram;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<TrainingProgram | null> {
    return (
      this.items.find(
        (program) =>
          program.id.equals(id) &&
          program.tenantId.toString() === tenantId &&
          !program.deletedAt,
      ) ?? null
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindTrainingProgramFilters,
  ): Promise<{ trainingPrograms: TrainingProgram[]; total: number }> {
    let filtered = this.items.filter(
      (program) =>
        program.tenantId.toString() === tenantId && !program.deletedAt,
    );

    if (filters?.category) {
      filtered = filtered.filter(
        (program) => program.category === filters.category,
      );
    }
    if (filters?.format) {
      filtered = filtered.filter(
        (program) => program.format === filters.format,
      );
    }
    if (filters?.isActive !== undefined) {
      filtered = filtered.filter(
        (program) => program.isActive === filters.isActive,
      );
    }
    if (filters?.isMandatory !== undefined) {
      filtered = filtered.filter(
        (program) => program.isMandatory === filters.isMandatory,
      );
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((program) =>
        program.name.toLowerCase().includes(searchLower),
      );
    }

    const total = filtered.length;
    const sorted = filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);

    return {
      trainingPrograms: sorted.slice((page - 1) * perPage, page * perPage),
      total,
    };
  }

  async update(
    data: UpdateTrainingProgramSchema,
  ): Promise<TrainingProgram | null> {
    const index = this.items.findIndex((program) => program.id.equals(data.id));
    if (index === -1) return null;

    const program = this.items[index];

    if (data.name !== undefined) program.updateName(data.name);
    if (data.isActive === false) program.deactivate();
    if (data.isActive === true) program.activate();
    if (data.description !== undefined) {
      program.props.description = data.description;
      program.props.updatedAt = new Date();
    }
    if (data.category !== undefined) {
      program.props.category = data.category;
      program.props.updatedAt = new Date();
    }
    if (data.format !== undefined) {
      program.props.format = data.format;
      program.props.updatedAt = new Date();
    }
    if (data.durationHours !== undefined) {
      program.props.durationHours = data.durationHours;
      program.props.updatedAt = new Date();
    }
    if (data.instructor !== undefined) {
      program.props.instructor = data.instructor;
      program.props.updatedAt = new Date();
    }
    if (data.maxParticipants !== undefined) {
      program.props.maxParticipants = data.maxParticipants;
      program.props.updatedAt = new Date();
    }
    if (data.isMandatory !== undefined) {
      program.props.isMandatory = data.isMandatory;
      program.props.updatedAt = new Date();
    }
    if (data.isMandatoryForESocial !== undefined) {
      program.props.isMandatoryForESocial = data.isMandatoryForESocial;
      program.props.updatedAt = new Date();
    }
    if (data.validityMonths !== undefined) {
      program.props.validityMonths = data.validityMonths;
      program.props.updatedAt = new Date();
    }

    return program;
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    const index = this.items.findIndex((program) => program.id.equals(id));
    if (index >= 0) {
      this.items[index].softDelete();
    }
  }
}
