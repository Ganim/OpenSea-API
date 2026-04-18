import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { AbsencesRepository } from '@/repositories/hr/absences-repository';

import type {
  PunchValidationContext,
  PunchValidationDecision,
  PunchValidator,
} from './punch-validator.interface';

/**
 * Rejects punches that fall inside an approved/in-progress absence
 * (atestado médico, licença, etc. — anything that legally blocks work).
 *
 * Uses the repo's `findOverlapping(employeeId, start, end, tenantId)` —
 * we treat the single timestamp as a zero-length window by passing it as
 * both the start and the end. Only statuses {APPROVED, IN_PROGRESS}
 * block; PENDING/REJECTED/CANCELLED/COMPLETED absences do not.
 *
 * VACATION-typed absences are ignored here — `VacationActiveValidator`
 * owns that check and double-rejection would be misleading to the user.
 */
export class AbsenceActiveValidator implements PunchValidator {
  readonly name = 'AbsenceActiveValidator';

  constructor(private readonly absencesRepository: AbsencesRepository) {}

  async validate(
    ctx: PunchValidationContext,
  ): Promise<PunchValidationDecision> {
    const overlapping = await this.absencesRepository.findOverlapping(
      new UniqueEntityID(ctx.employeeId),
      ctx.timestamp,
      ctx.timestamp,
      ctx.tenantId,
    );

    for (const abs of overlapping) {
      const statusVal = abs.status?.value;
      const typeVal = (abs as { type?: { value?: string } }).type?.value ?? '';
      if (statusVal !== 'APPROVED' && statusVal !== 'IN_PROGRESS') continue;
      // Skip vacation — owned by VacationActiveValidator.
      if (typeVal === 'VACATION') continue;

      return {
        outcome: 'REJECT',
        code: 'ON_SICK_LEAVE',
        reason:
          'Funcionário possui atestado aprovado em andamento; batidas não são permitidas durante o período',
      };
    }

    return { outcome: 'ACCEPT' };
  }
}
