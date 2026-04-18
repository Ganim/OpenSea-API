import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';

import type {
  PunchValidationContext,
  PunchValidationDecision,
  PunchValidator,
} from './punch-validator.interface';

/**
 * Rejects punches that fall inside an active vacation window.
 *
 * "Active" means status ∈ {`IN_PROGRESS`, `SCHEDULED`} AND the punch
 * timestamp falls between `scheduledStart..scheduledEnd` (the dates the
 * employee actually agreed to be on holidays). We deliberately ignore
 * `APPROVED`/`AVAILABLE` without a scheduled window because those are
 * "right to vacation" states, not "currently on vacation".
 *
 * The repo method `findManyByEmployeeAndStatus` takes a single status at
 * a time, so we query twice — preferable to loading all rows and
 * filtering client-side, which would grow with tenure.
 */
export class VacationActiveValidator implements PunchValidator {
  readonly name = 'VacationActiveValidator';

  constructor(
    private readonly vacationPeriodsRepository: VacationPeriodsRepository,
  ) {}

  async validate(
    ctx: PunchValidationContext,
  ): Promise<PunchValidationDecision> {
    const employeeId = new UniqueEntityID(ctx.employeeId);

    const relevantStatuses = ['IN_PROGRESS', 'SCHEDULED'];
    const periodsLists = await Promise.all(
      relevantStatuses.map((status) =>
        this.vacationPeriodsRepository.findManyByEmployeeAndStatus(
          employeeId,
          status,
          ctx.tenantId,
        ),
      ),
    );
    const periods = periodsLists.flat();

    const ts = ctx.timestamp;
    for (const period of periods) {
      const start = period.scheduledStart;
      const end = period.scheduledEnd;
      if (!start || !end) continue;
      if (start <= ts && ts <= end) {
        const formattedEnd = end.toLocaleDateString('pt-BR');
        return {
          outcome: 'REJECT',
          code: 'ON_VACATION',
          reason: `Funcionário está de férias aprovadas até ${formattedEnd}; batidas não são permitidas durante o período`,
        };
      }
    }

    return { outcome: 'ACCEPT' };
  }
}
