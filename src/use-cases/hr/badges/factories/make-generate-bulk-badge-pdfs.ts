import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';

import { GenerateBulkBadgePdfsUseCase } from '../generate-bulk-badge-pdfs';

/**
 * Factory for {@link GenerateBulkBadgePdfsUseCase} (Plan 05-06 Task 2).
 *
 * The use case only needs an EmployeesRepository — the actual BullMQ
 * `addJob` call happens inside the use case, using the shared queue
 * singletons from `@/lib/queue`.
 */
export function makeGenerateBulkBadgePdfsUseCase(): GenerateBulkBadgePdfsUseCase {
  return new GenerateBulkBadgePdfsUseCase(new PrismaEmployeesRepository());
}
