import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  CadenceSequence,
  type CadenceEnrollmentProps,
  type CadenceStepProps,
} from '@/entities/sales/cadence-sequence';
import type {
  CadenceSequencesRepository,
  CreateCadenceEnrollmentSchema,
  CreateCadenceSequenceSchema,
} from '../cadence-sequences-repository';

export class InMemoryCadenceSequencesRepository
  implements CadenceSequencesRepository
{
  public sequences: CadenceSequence[] = [];
  public enrollments: CadenceEnrollmentProps[] = [];

  async create(data: CreateCadenceSequenceSchema): Promise<CadenceSequence> {
    const sequenceId = new UniqueEntityID();

    const cadenceSteps: CadenceStepProps[] = data.steps.map(
      (stepInput, index) => ({
        id: new UniqueEntityID(),
        sequenceId,
        order: stepInput.order ?? index + 1,
        type: stepInput.type as CadenceStepProps['type'],
        delayDays: stepInput.delayDays,
        config: stepInput.config,
        createdAt: new Date(),
      }),
    );

    const cadenceSequence = CadenceSequence.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        name: data.name,
        description: data.description,
        createdBy: data.createdBy,
        steps: cadenceSteps,
      },
      sequenceId,
    );

    this.sequences.push(cadenceSequence);
    return cadenceSequence;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<CadenceSequence | null> {
    const sequenceRecord = this.sequences.find(
      (record) =>
        record.id.toString() === id.toString() &&
        record.tenantId.toString() === tenantId &&
        !record.deletedAt,
    );

    if (!sequenceRecord) return null;

    // Attach enrollment count
    const enrollmentCount = this.enrollments.filter(
      (enrollment) => enrollment.sequenceId.toString() === id.toString(),
    ).length;

    return CadenceSequence.create(
      {
        ...sequenceRecord.props,
        enrollmentCount,
      },
      sequenceRecord.id,
    );
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: { isActive?: boolean; search?: string },
  ): Promise<CadenceSequence[]> {
    let filteredSequences = this.sequences.filter(
      (record) => record.tenantId.toString() === tenantId && !record.deletedAt,
    );

    if (filters?.isActive !== undefined) {
      filteredSequences = filteredSequences.filter(
        (record) => record.isActive === filters.isActive,
      );
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredSequences = filteredSequences.filter((record) =>
        record.name.toLowerCase().includes(searchLower),
      );
    }

    const start = (page - 1) * perPage;
    return filteredSequences
      .sort(
        (sequenceA, sequenceB) =>
          sequenceB.createdAt.getTime() - sequenceA.createdAt.getTime(),
      )
      .slice(start, start + perPage);
  }

  async countMany(
    tenantId: string,
    filters?: { isActive?: boolean; search?: string },
  ): Promise<number> {
    let filteredSequences = this.sequences.filter(
      (record) => record.tenantId.toString() === tenantId && !record.deletedAt,
    );

    if (filters?.isActive !== undefined) {
      filteredSequences = filteredSequences.filter(
        (record) => record.isActive === filters.isActive,
      );
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredSequences = filteredSequences.filter((record) =>
        record.name.toLowerCase().includes(searchLower),
      );
    }

    return filteredSequences.length;
  }

  async save(cadenceSequence: CadenceSequence): Promise<void> {
    const sequenceIndex = this.sequences.findIndex(
      (record) => record.id.toString() === cadenceSequence.id.toString(),
    );

    if (sequenceIndex >= 0) {
      this.sequences[sequenceIndex] = cadenceSequence;
    }
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const sequenceRecord = this.sequences.find(
      (record) =>
        record.id.toString() === id.toString() &&
        record.tenantId.toString() === tenantId,
    );

    if (sequenceRecord) {
      sequenceRecord.delete();
    }
  }

  async createEnrollment(
    data: CreateCadenceEnrollmentSchema,
  ): Promise<CadenceEnrollmentProps> {
    const enrollment: CadenceEnrollmentProps = {
      id: new UniqueEntityID(),
      sequenceId: new UniqueEntityID(data.sequenceId),
      tenantId: new UniqueEntityID(data.tenantId),
      contactId: data.contactId,
      dealId: data.dealId,
      currentStepOrder: data.currentStepOrder,
      status: data.status,
      nextActionAt: data.nextActionAt,
      startedAt: new Date(),
      createdAt: new Date(),
    };

    this.enrollments.push(enrollment);
    return enrollment;
  }

  async findEnrollmentById(
    id: string,
    tenantId: string,
  ): Promise<CadenceEnrollmentProps | null> {
    const enrollment = this.enrollments.find(
      (record) =>
        record.id.toString() === id && record.tenantId.toString() === tenantId,
    );

    return enrollment ?? null;
  }

  async saveEnrollment(enrollment: CadenceEnrollmentProps): Promise<void> {
    const enrollmentIndex = this.enrollments.findIndex(
      (record) => record.id.toString() === enrollment.id.toString(),
    );

    if (enrollmentIndex >= 0) {
      this.enrollments[enrollmentIndex] = enrollment;
    }
  }

  async findPendingEnrollments(
    tenantId: string,
    now: Date,
  ): Promise<CadenceEnrollmentProps[]> {
    return this.enrollments.filter(
      (record) =>
        record.tenantId.toString() === tenantId &&
        record.status === 'ACTIVE' &&
        record.nextActionAt &&
        record.nextActionAt.getTime() <= now.getTime(),
    );
  }
}
