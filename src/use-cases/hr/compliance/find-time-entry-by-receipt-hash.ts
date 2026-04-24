/**
 * `FindTimeEntryByReceiptHashUseCase` (Phase 06 / Plan 06-03).
 *
 * Resolve o hash público (`nsrHash`) da rota `GET /v1/public/punch/verify/:nsrHash`
 * em um DTO LGPD-whitelisted. Este use case é o ponto único de acesso ao
 * banco para a rota pública; qualquer mudança de campo exposto passa pelo
 * mapper `toPublicReceiptDto`.
 *
 * Fluxo:
 *   1. Valida formato do hash (regex defense-in-depth — controller valida também).
 *   2. `timeEntryRepo.findByReceiptVerifyHash(hash)` → `null` ou projeção flat.
 *   3. Se null → loga `ComplianceVerifyLog(hitResult='NOT_FOUND')` + retorna null.
 *   4. Se achado → fetch Employee + Tenant + tenantCnpj em paralelo.
 *   5. Loga `ComplianceVerifyLog(hitResult='FOUND')` com tenant + timeEntry.
 *   6. Retorna DTO via `toPublicReceiptDto`.
 *
 * LGPD: o DTO retornado NUNCA contém CPF, matrícula, e-mail, endereço, foto,
 * GPS, device info ou IDs internos. Contract enforçado por teste sentinela em
 * `find-time-entry-by-receipt-hash.spec.ts` e por e2e sentinelas no controller.
 */

import { z } from 'zod';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ComplianceVerifyLog,
  type ComplianceVerifyHitResult,
} from '@/entities/hr/compliance-public-verify-log';
import {
  toPublicReceiptDto,
  type PublicReceiptDto,
} from '@/mappers/hr/public-receipt-mapper';
import type { ComplianceVerifyLogRepository } from '@/repositories/hr/compliance-public-verify-log-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type {
  TimeEntriesRepository,
  TimeEntryForReceiptLookup,
} from '@/repositories/hr/time-entries-repository';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';

// Lazy logger import — evita acoplar o use case ao logger real em specs de
// unidade que usam in-memory repos. Mesmo padrão do receipt-pdf-worker.
let _logger: {
  info: (obj: unknown, msg: string) => void;
  warn: (obj: unknown, msg: string) => void;
  error: (obj: unknown, msg: string) => void;
} | null = null;
function getLogger() {
  if (!_logger) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _logger = require('@/lib/logger').logger;
    } catch {
      _logger = {
        info: (obj, msg) => console.log(msg, obj),
        warn: (obj, msg) => console.warn(msg, obj),
        error: (obj, msg) => console.error(msg, obj),
      };
    }
  }
  return _logger!;
}

/**
 * Resolver opaco do CNPJ do tenant. Encapsula a ordem de fallback
 * (EsocialConfig.employerDocument → Tenant.settings.cnpj → '00000000000000').
 * Injetado para permitir override em testes (use-case fica agnóstico à fonte).
 */
export interface TenantCnpjResolver {
  resolve(tenantId: string): Promise<string>;
}

/**
 * Input da rota pública. `accessedFromIp` / `accessedByUserAgent` são
 * capturados do request pelo controller e persistidos no verify log.
 */
const inputSchema = z.object({
  nsrHash: z.string().regex(/^[a-f0-9]{64}$/, 'Código inválido'),
  accessedFromIp: z.string().max(45).optional().nullable(),
  accessedByUserAgent: z.string().max(500).optional().nullable(),
});

export type FindTimeEntryByReceiptHashInput = z.infer<typeof inputSchema>;

export class FindTimeEntryByReceiptHashUseCase {
  constructor(
    private readonly timeEntryRepo: TimeEntriesRepository,
    private readonly employeeRepo: EmployeesRepository,
    private readonly tenantRepo: TenantsRepository,
    private readonly verifyLogRepo: ComplianceVerifyLogRepository,
    private readonly tenantCnpjResolver: TenantCnpjResolver,
  ) {}

  async execute(raw: unknown): Promise<PublicReceiptDto | null> {
    const input = inputSchema.parse(raw);

    const timeEntry = await this.timeEntryRepo.findByReceiptVerifyHash(
      input.nsrHash,
    );

    if (!timeEntry) {
      await this.writeVerifyLog({
        nsrHash: input.nsrHash,
        tenantId: null,
        timeEntryId: null,
        ipAddress: input.accessedFromIp ?? null,
        userAgent: input.accessedByUserAgent ?? null,
        hitResult: 'NOT_FOUND',
      });
      return null;
    }

    return this.resolveAndRespond(timeEntry, input);
  }

  private async resolveAndRespond(
    timeEntry: TimeEntryForReceiptLookup,
    input: FindTimeEntryByReceiptHashInput,
  ): Promise<PublicReceiptDto | null> {
    const [employee, tenant, tenantCnpj] = await Promise.all([
      this.employeeRepo.findById(
        new UniqueEntityID(timeEntry.employeeId),
        timeEntry.tenantId,
      ),
      this.tenantRepo.findById(new UniqueEntityID(timeEntry.tenantId)),
      this.tenantCnpjResolver.resolve(timeEntry.tenantId),
    ]);

    if (!employee || !tenant) {
      // Estado raro — batida existe mas employee/tenant foi removido. Tratamos
      // como NOT_FOUND ao público (não vazamos estado inconsistente). WR-06:
      // logar o estado de inconsistência para investigação/métricas em vez
      // do anti-pattern `Promise.reject().catch(() => null as never)` que
      // descartava o erro silenciosamente.
      getLogger().error(
        {
          nsrHash: input.nsrHash,
          timeEntryId: timeEntry.id,
          tenantId: timeEntry.tenantId,
          employeeMissing: !employee,
          tenantMissing: !tenant,
        },
        '[FindTimeEntryByReceiptHash] Inconsistência: TimeEntry sem Employee/Tenant — retornando NOT_FOUND ao público',
      );
      await this.writeVerifyLog({
        nsrHash: input.nsrHash,
        tenantId: null,
        timeEntryId: null,
        ipAddress: input.accessedFromIp ?? null,
        userAgent: input.accessedByUserAgent ?? null,
        hitResult: 'NOT_FOUND',
      });
      return null;
    }

    await this.writeVerifyLog({
      nsrHash: input.nsrHash,
      tenantId: timeEntry.tenantId,
      timeEntryId: timeEntry.id,
      ipAddress: input.accessedFromIp ?? null,
      userAgent: input.accessedByUserAgent ?? null,
      hitResult: 'FOUND',
    });

    return toPublicReceiptDto({
      employee: {
        socialName: employee.socialName,
        fullName: employee.fullName,
      },
      tenant: { name: tenant.name },
      tenantCnpj,
      timeEntry: {
        nsrNumber: timeEntry.nsrNumber,
        timestamp: timeEntry.timestamp,
        entryType: timeEntry.entryType,
        approvalStatus: timeEntry.approvalStatus,
      },
    });
  }

  private async writeVerifyLog(params: {
    nsrHash: string;
    tenantId: string | null;
    timeEntryId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    hitResult: ComplianceVerifyHitResult;
  }): Promise<void> {
    const log = ComplianceVerifyLog.create({
      nsrHash: params.nsrHash,
      tenantId: params.tenantId
        ? new UniqueEntityID(params.tenantId)
        : undefined,
      timeEntryId: params.timeEntryId
        ? new UniqueEntityID(params.timeEntryId)
        : undefined,
      ipAddress: params.ipAddress ?? undefined,
      userAgent: params.userAgent ?? undefined,
      hitResult: params.hitResult,
    });
    await this.verifyLogRepo.create(log);
  }
}
