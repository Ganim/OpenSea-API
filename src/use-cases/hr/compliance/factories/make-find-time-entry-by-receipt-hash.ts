/**
 * Factory `FindTimeEntryByReceiptHashUseCase` (Phase 06 / Plan 06-03).
 *
 * Wire:
 *   - PrismaTimeEntriesRepository (findByReceiptVerifyHash)
 *   - PrismaEmployeesRepository   (findById)
 *   - PrismaTenantsRepository     (findById)
 *   - PrismaComplianceVerifyLogRepository (create)
 *   - TenantCnpjResolver concreto: EsocialConfig.employerDocument com
 *     fallback para Tenant.settings.cnpj, senão '00000000000000' (mesma
 *     ordem do `build-afd-dataset.ts` do Plan 06-02).
 */

import { prisma } from '@/lib/prisma';
import { PrismaComplianceVerifyLogRepository } from '@/repositories/hr/prisma/prisma-compliance-public-verify-log-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaTimeEntriesRepository } from '@/repositories/hr/prisma/prisma-time-entries-repository';
import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';

import {
  FindTimeEntryByReceiptHashUseCase,
  type TenantCnpjResolver,
} from '../find-time-entry-by-receipt-hash';

/**
 * Implementação concreta do resolver usando Prisma direto (único leitor de
 * `EsocialConfig` + `Tenant.settings` — não há repo dedicado para este
 * insumo, e o custo de criar um só para 3 campos não compensa).
 */
const prismaTenantCnpjResolver: TenantCnpjResolver = {
  async resolve(tenantId: string): Promise<string> {
    const onlyDigits = (v: string | null | undefined): string | null => {
      if (!v) return null;
      const d = v.replace(/\D/g, '');
      return d.length ? d : null;
    };

    const [cfg, tenant] = await Promise.all([
      prisma.esocialConfig.findUnique({
        where: { tenantId },
        select: { employerDocument: true },
      }),
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { settings: true },
      }),
    ]);

    const fromCfg = onlyDigits(cfg?.employerDocument);
    if (fromCfg && fromCfg.length === 14) return fromCfg;

    const settings = (tenant?.settings ?? {}) as Record<string, unknown>;
    if (typeof settings.cnpj === 'string') {
      const fromSettings = onlyDigits(settings.cnpj);
      if (fromSettings && fromSettings.length === 14) return fromSettings;
    }

    return '00000000000000';
  },
};

export function makeFindTimeEntryByReceiptHashUseCase() {
  const timeEntryRepo = new PrismaTimeEntriesRepository();
  const employeeRepo = new PrismaEmployeesRepository();
  const tenantRepo = new PrismaTenantsRepository();
  const verifyLogRepo = new PrismaComplianceVerifyLogRepository();
  return new FindTimeEntryByReceiptHashUseCase(
    timeEntryRepo,
    employeeRepo,
    tenantRepo,
    verifyLogRepo,
    prismaTenantCnpjResolver,
  );
}
