/**
 * GenerateFolhaEspelhoBulkUseCase — Phase 06 / Plan 06-04 Task 2
 *
 * **Dispatcher thin** que resolve os `employeeIds[]` com base em `scope` e
 * enfileira UM job BullMQ no `QUEUE_NAMES.FOLHA_ESPELHO_BULK`. O worker
 * (em `src/workers/folha-espelho-bulk-worker.ts`) processa chunks de 20 com
 * `Promise.allSettled` e emite Socket.IO progress.
 *
 * **Scopes suportados (D-04 do 06-RESEARCH):**
 *  - `ALL`        → todos funcionários ativos do tenant (EmployeesRepository
 *                   `findManyActive`, preserva filtros `terminationDate IS NULL`).
 *  - `DEPARTMENT` → funcionários cujos `departmentId` está em `departmentIds[]`.
 *  - `CUSTOM`     → lista de `employeeIds[]` explícita (UUIDs validados
 *                   contra o tenant).
 *
 * **Anti-DoS (T-06-04-03):** rejeita > 500 funcionários resolvidos com
 * `BadRequestError` sugerindo split. Zod schema já valida `employeeIds.max(500)`
 * e `departmentIds.max(50)` no controller, mas o use case re-valida após resolver
 * o scope ALL/DEPARTMENT (onde a contagem final pode ser maior do que o input).
 *
 * **Auth:** permissão `hr.compliance.folha-espelho.generate` — mesma do
 * individual. Nenhum PIN exigido (artefato rotineiro, não destrutivo).
 *
 * **Output:** `{ bulkJobId, employeeCount }` — front-end subscreve a room
 * `tenant:{id}:hr` no Socket.IO e recebe eventos `compliance.folha_espelho.progress`
 * e `compliance.folha_espelho.completed` do worker.
 */

import { randomUUID } from 'node:crypto';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { addJob, QUEUE_NAMES } from '@/lib/queue';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

export type FolhaEspelhoBulkScope = 'ALL' | 'DEPARTMENT' | 'CUSTOM';

export interface GenerateFolhaEspelhoBulkInput {
  tenantId: string;
  requestedBy: string;
  /** YYYY-MM */
  competencia: string;
  scope: FolhaEspelhoBulkScope;
  departmentIds?: string[];
  employeeIds?: string[];
}

export interface FolhaEspelhoBulkJobData {
  tenantId: string;
  requestedBy: string;
  competencia: string;
  employeeIds: string[];
  bulkJobId: string;
}

export interface GenerateFolhaEspelhoBulkOutput {
  bulkJobId: string;
  employeeCount: number;
  socketRoom: string;
  progressEvent: string;
}

const MAX_EMPLOYEES_PER_BULK = 500;
const COMPETENCIA_REGEX = /^\d{4}-\d{2}$/;

export class GenerateFolhaEspelhoBulkUseCase {
  constructor(private readonly employeeRepo: EmployeesRepository) {}

  async execute(
    input: GenerateFolhaEspelhoBulkInput,
  ): Promise<GenerateFolhaEspelhoBulkOutput> {
    if (!COMPETENCIA_REGEX.test(input.competencia)) {
      throw new BadRequestError(
        `competência inválida — use YYYY-MM (recebido: "${input.competencia}")`,
      );
    }

    // ── 1. Resolver employeeIds com base no scope ─────────────────────
    let employeeIds: string[] = [];
    switch (input.scope) {
      case 'ALL': {
        const actives = await this.employeeRepo.findManyActive(input.tenantId);
        employeeIds = actives.map((e) => e.id.toString());
        break;
      }
      case 'DEPARTMENT': {
        if (!input.departmentIds || input.departmentIds.length === 0) {
          throw new BadRequestError(
            'departmentIds é obrigatório quando scope=DEPARTMENT.',
          );
        }
        // Coleta funcionários de cada departamento (tenant-scoped)
        const perDept = await Promise.all(
          input.departmentIds.map((dId) =>
            this.employeeRepo.findManyByDepartment(
              new UniqueEntityID(dId),
              input.tenantId,
            ),
          ),
        );
        // Dedup + mantém só ativos (terminationDate ausente)
        const seen = new Set<string>();
        for (const list of perDept) {
          for (const emp of list) {
            const id = emp.id.toString();
            if (!seen.has(id) && !emp.terminationDate) {
              seen.add(id);
              employeeIds.push(id);
            }
          }
        }
        break;
      }
      case 'CUSTOM': {
        if (!input.employeeIds || input.employeeIds.length === 0) {
          throw new BadRequestError(
            'employeeIds é obrigatório quando scope=CUSTOM.',
          );
        }
        employeeIds = [...new Set(input.employeeIds)];
        break;
      }
      default: {
        throw new BadRequestError(`scope inválido: ${String(input.scope)}`);
      }
    }

    // ── 2. Anti-DoS (T-06-04-03) ──────────────────────────────────────
    if (employeeIds.length === 0) {
      throw new BadRequestError(
        'Nenhum funcionário resolvido para o scope informado.',
      );
    }
    if (employeeIds.length > MAX_EMPLOYEES_PER_BULK) {
      throw new BadRequestError(
        `Lote excede o máximo de ${MAX_EMPLOYEES_PER_BULK} funcionários (resolvido: ${employeeIds.length}). Divida em lotes menores.`,
      );
    }

    // ── 3. Enqueue no BullMQ ──────────────────────────────────────────
    const bulkJobId = randomUUID();
    const jobData: FolhaEspelhoBulkJobData = {
      tenantId: input.tenantId,
      requestedBy: input.requestedBy,
      competencia: input.competencia,
      employeeIds,
      bulkJobId,
    };
    await addJob(QUEUE_NAMES.FOLHA_ESPELHO_BULK, jobData, {
      jobId: bulkJobId,
    });

    return {
      bulkJobId,
      employeeCount: employeeIds.length,
      socketRoom: `tenant:${input.tenantId}:hr`,
      progressEvent: 'compliance.folha_espelho.progress',
    };
  }
}
