import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';

import { GenerateFolhaEspelhoBulkUseCase } from '../generate-folha-espelho-bulk';

/**
 * Phase 06 / Plan 06-04 — factory de `GenerateFolhaEspelhoBulkUseCase`.
 *
 * O dispatcher é thin — só precisa resolver employeeIds via EmployeesRepository
 * e enfileirar o job. O worker (`folha-espelho-bulk-worker`) é que consome e
 * chama o use case individual para cada funcionário.
 */
export function makeGenerateFolhaEspelhoBulkUseCase() {
  return new GenerateFolhaEspelhoBulkUseCase(new PrismaEmployeesRepository());
}
