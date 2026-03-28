import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TrainingEnrollment } from '@/entities/hr/training-enrollment';
import type {
  CreateTrainingEnrollmentSchema,
  FindTrainingEnrollmentFilters,
  TrainingEnrollmentsRepository,
  UpdateTrainingEnrollmentSchema,
} from '../training-enrollments-repository';

export class InMemoryTrainingEnrollmentsRepository
  implements TrainingEnrollmentsRepository
{
  public items: TrainingEnrollment[] = [];

  async create(
    data: CreateTrainingEnrollmentSchema,
  ): Promise<TrainingEnrollment> {
    const enrollment = TrainingEnrollment.create({
      tenantId: new UniqueEntityID(data.tenantId),
      trainingProgramId: data.trainingProgramId,
      employeeId: data.employeeId,
      status: data.status ?? 'ENROLLED',
      enrolledAt: new Date(),
      notes: data.notes,
    });

    this.items.push(enrollment);
    return enrollment;
  }

  async bulkCreate(
    enrollments: CreateTrainingEnrollmentSchema[],
  ): Promise<TrainingEnrollment[]> {
    const created: TrainingEnrollment[] = [];
    for (const data of enrollments) {
      const enrollment = await this.create(data);
      created.push(enrollment);
    }
    return created;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<TrainingEnrollment | null> {
    return (
      this.items.find(
        (enrollment) =>
          enrollment.id.equals(id) &&
          enrollment.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindTrainingEnrollmentFilters,
  ): Promise<{ enrollments: TrainingEnrollment[]; total: number }> {
    let filtered = this.items.filter(
      (enrollment) => enrollment.tenantId.toString() === tenantId,
    );

    if (filters?.trainingProgramId) {
      filtered = filtered.filter((enrollment) =>
        enrollment.trainingProgramId.equals(filters.trainingProgramId!),
      );
    }
    if (filters?.employeeId) {
      filtered = filtered.filter((enrollment) =>
        enrollment.employeeId.equals(filters.employeeId!),
      );
    }
    if (filters?.status) {
      filtered = filtered.filter(
        (enrollment) => enrollment.status === filters.status,
      );
    }

    const total = filtered.length;
    const sorted = filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);

    return {
      enrollments: sorted.slice((page - 1) * perPage, page * perPage),
      total,
    };
  }

  async findByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TrainingEnrollment[]> {
    return this.items.filter(
      (enrollment) =>
        enrollment.employeeId.equals(employeeId) &&
        enrollment.tenantId.toString() === tenantId,
    );
  }

  async findByProgramAndEmployee(
    trainingProgramId: UniqueEntityID,
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TrainingEnrollment | null> {
    return (
      this.items.find(
        (enrollment) =>
          enrollment.trainingProgramId.equals(trainingProgramId) &&
          enrollment.employeeId.equals(employeeId) &&
          enrollment.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async update(
    data: UpdateTrainingEnrollmentSchema,
  ): Promise<TrainingEnrollment | null> {
    const index = this.items.findIndex((enrollment) =>
      enrollment.id.equals(data.id),
    );
    if (index === -1) return null;

    const enrollment = this.items[index];

    if (data.status !== undefined) {
      enrollment.props.status = data.status;
      enrollment.props.updatedAt = new Date();
    }
    if (data.startedAt !== undefined) {
      enrollment.props.startedAt = data.startedAt;
      enrollment.props.updatedAt = new Date();
    }
    if (data.completedAt !== undefined) {
      enrollment.props.completedAt = data.completedAt;
      enrollment.props.updatedAt = new Date();
    }
    if (data.score !== undefined) {
      enrollment.props.score = data.score;
      enrollment.props.updatedAt = new Date();
    }
    if (data.certificateUrl !== undefined) {
      enrollment.props.certificateUrl = data.certificateUrl;
      enrollment.props.updatedAt = new Date();
    }
    if (data.notes !== undefined) {
      enrollment.props.notes = data.notes;
      enrollment.props.updatedAt = new Date();
    }

    return enrollment;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((enrollment) =>
      enrollment.id.equals(id),
    );
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
