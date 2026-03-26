import { PrismaEsocialEventsRepository } from '@/repositories/esocial/prisma/prisma-esocial-events-repository';
import { PrismaEsocialConfigRepository } from '@/repositories/esocial/prisma/prisma-esocial-config-repository';
import { PrismaEsocialRubricasRepository } from '@/repositories/esocial/prisma/prisma-esocial-rubricas-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaAbsencesRepository } from '@/repositories/hr/prisma/prisma-absences-repository';
import { PrismaTerminationsRepository } from '@/repositories/hr/prisma/prisma-terminations-repository';
import { PrismaDependantsRepository } from '@/repositories/hr/prisma/prisma-dependants-repository';
import { PrismaMedicalExamsRepository } from '@/repositories/hr/prisma/prisma-medical-exams-repository';
import { PrismaPayrollsRepository } from '@/repositories/hr/prisma/prisma-payrolls-repository';
import { PrismaPayrollItemsRepository } from '@/repositories/hr/prisma/prisma-payroll-items-repository';
import { GenerateEventUseCase } from '../generate-event';

export function makeGenerateEventUseCase(): GenerateEventUseCase {
  return new GenerateEventUseCase(
    new PrismaEsocialEventsRepository(),
    new PrismaEsocialConfigRepository(),
    new PrismaEsocialRubricasRepository(),
    new PrismaEmployeesRepository(),
    new PrismaAbsencesRepository(),
    new PrismaTerminationsRepository(),
    new PrismaDependantsRepository(),
    new PrismaMedicalExamsRepository(),
    new PrismaPayrollsRepository(),
    new PrismaPayrollItemsRepository(),
  );
}
