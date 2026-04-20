import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { RotateQrTokenUseCase } from '@/use-cases/hr/qr-tokens/rotate-qr-token';

import { GenerateBadgePdfUseCase } from '../generate-badge-pdf';

/**
 * Factory for {@link GenerateBadgePdfUseCase} (Plan 05-06 Task 1).
 *
 * Wires the use case against the Prisma-backed repositories plus the live
 * {@link RotateQrTokenUseCase} — every individual PDF emit rotates the
 * target employee's QR token (D-14 individual behaviour: "admin baixa novo
 * crachá na sequência").
 */
export function makeGenerateBadgePdfUseCase(): GenerateBadgePdfUseCase {
  const employeesRepo = new PrismaEmployeesRepository();
  const tenantsRepo = new PrismaTenantsRepository();
  const rotateQrTokenUseCase = new RotateQrTokenUseCase(employeesRepo);
  return new GenerateBadgePdfUseCase(
    employeesRepo,
    tenantsRepo,
    rotateQrTokenUseCase,
  );
}
