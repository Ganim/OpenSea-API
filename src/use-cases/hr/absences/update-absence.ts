import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Absence } from '@/entities/hr/absence';
import type { AbsencesRepository } from '@/repositories/hr/absences-repository';

export interface UpdateAbsenceRequest {
  tenantId: string;
  absenceId: string;
  startDate?: Date;
  endDate?: Date;
  type?: string;
  reason?: string;
  notes?: string;
  documentUrl?: string | null;
  cid?: string | null;
}

export interface UpdateAbsenceResponse {
  absence: Absence;
}

export class UpdateAbsenceUseCase {
  constructor(private absencesRepository: AbsencesRepository) {}

  async execute(request: UpdateAbsenceRequest): Promise<UpdateAbsenceResponse> {
    const {
      tenantId,
      absenceId,
      startDate,
      endDate,
      type,
      reason,
      notes,
      documentUrl,
      cid,
    } = request;

    const absence = await this.absencesRepository.findById(
      new UniqueEntityID(absenceId),
      tenantId,
    );

    if (!absence) {
      throw new ResourceNotFoundError('Ausência não encontrada');
    }

    // Only PENDING absences can be updated
    if (!absence.isPending()) {
      throw new BadRequestError(
        'Somente ausências pendentes podem ser editadas',
      );
    }

    // Determine effective dates
    const effectiveStartDate = startDate ?? absence.startDate;
    const effectiveEndDate = endDate ?? absence.endDate;

    // Validate dates
    if (effectiveEndDate < effectiveStartDate) {
      throw new BadRequestError(
        'A data de término deve ser posterior à data de início',
      );
    }

    // Check for overlapping absences (excluding the current one)
    if (startDate || endDate) {
      const overlapping = await this.absencesRepository.findOverlapping(
        absence.employeeId,
        effectiveStartDate,
        effectiveEndDate,
        tenantId,
        new UniqueEntityID(absenceId),
      );

      if (overlapping.length > 0) {
        throw new BadRequestError(
          'Já existe uma ausência registrada para este período',
        );
      }
    }

    // Calculate total days if dates changed
    const totalDays =
      startDate || endDate
        ? Absence.calculateTotalDays(effectiveStartDate, effectiveEndDate)
        : undefined;

    const updatedAbsence = await this.absencesRepository.update({
      id: new UniqueEntityID(absenceId),
      startDate,
      endDate,
      type,
      totalDays,
      reason: reason?.trim(),
      notes: notes?.trim(),
      documentUrl:
        documentUrl !== undefined ? (documentUrl ?? undefined) : undefined,
      cid: cid !== undefined ? (cid ?? undefined) : undefined,
    });

    if (!updatedAbsence) {
      throw new ResourceNotFoundError('Ausência não encontrada');
    }

    return {
      absence: updatedAbsence,
    };
  }
}
