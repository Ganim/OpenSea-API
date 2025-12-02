import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Absence } from '@/entities/hr/absence';
import { AbsencesRepository } from '@/repositories/hr/absences-repository';

export interface GetAbsenceRequest {
  absenceId: string;
}

export interface GetAbsenceResponse {
  absence: Absence;
}

export class GetAbsenceUseCase {
  constructor(private absencesRepository: AbsencesRepository) {}

  async execute(request: GetAbsenceRequest): Promise<GetAbsenceResponse> {
    const { absenceId } = request;

    const absence = await this.absencesRepository.findById(
      new UniqueEntityID(absenceId),
    );

    if (!absence) {
      throw new ResourceNotFoundError('Absence');
    }

    return {
      absence,
    };
  }
}
