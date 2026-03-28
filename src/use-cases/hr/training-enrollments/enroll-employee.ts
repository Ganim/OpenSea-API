import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TrainingEnrollment } from '@/entities/hr/training-enrollment';
import type { TrainingEnrollmentsRepository } from '@/repositories/hr/training-enrollments-repository';
import type { TrainingProgramsRepository } from '@/repositories/hr/training-programs-repository';

export interface EnrollEmployeeRequest {
  tenantId: string;
  trainingProgramId: string;
  employeeId: string;
  notes?: string;
}

export interface EnrollEmployeeResponse {
  enrollment: TrainingEnrollment;
}

export class EnrollEmployeeUseCase {
  constructor(
    private trainingEnrollmentsRepository: TrainingEnrollmentsRepository,
    private trainingProgramsRepository: TrainingProgramsRepository,
  ) {}

  async execute(
    request: EnrollEmployeeRequest,
  ): Promise<EnrollEmployeeResponse> {
    const { tenantId, trainingProgramId, employeeId, notes } = request;

    const trainingProgram = await this.trainingProgramsRepository.findById(
      new UniqueEntityID(trainingProgramId),
      tenantId,
    );

    if (!trainingProgram) {
      throw new ResourceNotFoundError('Programa de treinamento não encontrado');
    }

    if (!trainingProgram.isActive) {
      throw new BadRequestError('O programa de treinamento está inativo');
    }

    const existingEnrollment =
      await this.trainingEnrollmentsRepository.findByProgramAndEmployee(
        new UniqueEntityID(trainingProgramId),
        new UniqueEntityID(employeeId),
        tenantId,
      );

    if (existingEnrollment) {
      throw new BadRequestError(
        'O funcionário já está inscrito neste programa de treinamento',
      );
    }

    if (trainingProgram.maxParticipants) {
      const { total: currentEnrollments } =
        await this.trainingEnrollmentsRepository.findMany(tenantId, {
          trainingProgramId: new UniqueEntityID(trainingProgramId),
        });

      if (currentEnrollments >= trainingProgram.maxParticipants) {
        throw new BadRequestError(
          'O programa de treinamento atingiu o limite máximo de participantes',
        );
      }
    }

    const enrollment = await this.trainingEnrollmentsRepository.create({
      tenantId,
      trainingProgramId: new UniqueEntityID(trainingProgramId),
      employeeId: new UniqueEntityID(employeeId),
      notes,
    });

    return { enrollment };
  }
}
