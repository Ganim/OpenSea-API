import { PrismaAbsencesRepository } from '@/repositories/hr/prisma/prisma-absences-repository';
import { PrismaComplianceArtifactRepository } from '@/repositories/hr/prisma/prisma-compliance-artifact-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaOvertimeRepository } from '@/repositories/hr/prisma/prisma-overtime-repository';
import { PrismaShiftAssignmentsRepository } from '@/repositories/hr/prisma/prisma-shift-assignments-repository';
import { PrismaShiftsRepository } from '@/repositories/hr/prisma/prisma-shifts-repository';
import { PrismaTimeBankRepository } from '@/repositories/hr/prisma/prisma-time-bank-repository';
import { PrismaTimeEntriesRepository } from '@/repositories/hr/prisma/prisma-time-entries-repository';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';

import { GenerateFolhaEspelhoUseCase } from '../generate-folha-espelho';
import { TimeBankConsolidationAdapter } from '../time-bank-consolidation-adapter';

/**
 * Phase 06 / Plan 06-04 — factory de `GenerateFolhaEspelhoUseCase`.
 *
 * Injeta todos os repositórios Prisma necessários pelo
 * TimeBankConsolidationAdapter + o singleton do S3FileUploadService. Controller
 * é quem resolve o tenantContext (razaoSocial, cnpj, etc) via query Prisma
 * antes de chamar o use case — mesma orquestração de AFD/AFDT (Plan 06-02).
 */
export function makeGenerateFolhaEspelhoUseCase() {
  const employeesRepo = new PrismaEmployeesRepository();
  const timeEntriesRepo = new PrismaTimeEntriesRepository();
  const overtimeRepo = new PrismaOvertimeRepository();
  const absencesRepo = new PrismaAbsencesRepository();
  const shiftAssignmentsRepo = new PrismaShiftAssignmentsRepository();
  const shiftsRepo = new PrismaShiftsRepository();
  const timeBankRepo = new PrismaTimeBankRepository();

  const adapter = new TimeBankConsolidationAdapter(
    timeEntriesRepo,
    overtimeRepo,
    absencesRepo,
    shiftAssignmentsRepo,
    shiftsRepo,
    timeBankRepo,
    employeesRepo,
  );

  return new GenerateFolhaEspelhoUseCase(
    employeesRepo,
    adapter,
    new PrismaComplianceArtifactRepository(),
    S3FileUploadService.getInstance(),
  );
}
