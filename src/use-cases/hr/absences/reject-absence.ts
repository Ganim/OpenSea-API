import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Absence } from '@/entities/hr/absence';
import { AbsencesRepository } from '@/repositories/hr/absences-repository';

export interface RejectAbsenceRequest {
  absenceId: string;
  rejectedBy: string;
  reason: string;
}

export interface RejectAbsenceResponse {
  absence: Absence;
}

export class RejectAbsenceUseCase {
  constructor(private absencesRepository: AbsencesRepository) {}

  async execute(request: RejectAbsenceRequest): Promise<RejectAbsenceResponse> {
    const { absenceId, rejectedBy, reason } = request;

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      throw new Error('Rejection reason must be at least 10 characters');
    }

    // Find absence
    const absence = await this.absencesRepository.findById(
      new UniqueEntityID(absenceId),
    );
    if (!absence) {
      throw new Error('Absence not found');
    }

    // Check if can be rejected
    if (!absence.isPending()) {
      throw new Error('Only pending absences can be rejected');
    }

    // Reject the absence
    absence.reject(new UniqueEntityID(rejectedBy), reason.trim());
    await this.absencesRepository.save(absence);

    return {
      absence,
    };
  }
}
