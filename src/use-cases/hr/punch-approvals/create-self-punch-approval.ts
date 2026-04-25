import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { EvidenceFileNotFoundError } from '@/@errors/use-cases/evidence-file-not-found-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  PunchApproval,
  type PunchApprovalReason,
} from '@/entities/hr/punch-approval';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PunchApprovalsRepository } from '@/repositories/hr/punch-approvals-repository';
import type { TimeEntriesRepository } from '@/repositories/hr/time-entries-repository';
import type {
  FileUploadService,
  HeadObjectResult,
} from '@/services/storage/file-upload-service';

/**
 * Phase 8 / Plan 08-01 — D-07/D-08.
 *
 * Funcionário comum cria via PWA pessoal uma `PunchApproval` PENDING para si
 * mesmo. Dois cenários atendidos:
 *
 *  1) `timeEntryId` informado — funcionário justifica uma batida existente
 *     (geralmente uma flagueada com OUT_OF_GEOFENCE / FACE_MATCH_LOW que ele
 *     antecipa antes do gestor abrir o pedido).
 *
 *  2) `proposedTimestamp` + `entryType` — funcionário esqueceu de bater e
 *     pede ao gestor para registrar a batida (gestor aprova → cria via
 *     correctionPayload no resolve, lifecycle Phase 6-02).
 *
 * Ambos os cenários compartilham:
 *  - autenticação por JWT (resolverUserId via request.user.sub);
 *  - Employee linkado ao userId (caso contrário 404 — RH precisa fazer link
 *    via /hr/employees admin);
 *  - rate-limit anti-spam: máx 5 PunchApproval PENDING por employee;
 *  - validação opcional de `evidenceFileKeys` via S3 headObject (anti
 *    phantom-keys, mesmo padrão do resolve em Phase 7-03);
 *  - status sempre PENDING — o gestor é o único agente capaz de transição
 *    para APPROVED/REJECTED.
 *
 * Sem PIN gate (D-08 ratificado: o funcionário próprio anexando atestado
 * dele mesmo NÃO precisa PIN — atrito alto vs valor de segurança baixo).
 */
const MAX_PENDING_PER_EMPLOYEE = 5;

export type CreateSelfPunchApprovalReason = PunchApprovalReason;

export interface CreateSelfPunchApprovalRequest {
  tenantId: string;
  /** request.user.sub — resolvido para Employee via repo `findByUserId`. */
  userId: string;
  /** Cenário 1 — justificar batida existente (deve pertencer ao employee). */
  timeEntryId?: string;
  /** Cenário 2 — pedir registro de batida ausente. */
  proposedTimestamp?: string;
  entryType?: 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END';
  reason: CreateSelfPunchApprovalReason;
  note?: string;
  /** Storage keys já enviadas via endpoint upload — validadas via headObject. */
  evidenceFileKeys?: string[];
}

export interface CreateSelfPunchApprovalResponse {
  approvalId: string;
  status: 'PENDING';
  createdAt: string;
}

export class CreateSelfPunchApprovalUseCase {
  constructor(
    private readonly punchApprovalsRepository: PunchApprovalsRepository,
    private readonly employeesRepository: EmployeesRepository,
    private readonly timeEntriesRepository?: TimeEntriesRepository,
    /**
     * Opcional para preservar simplicidade em specs unit que não exercem
     * `evidenceFileKeys`. Quando ausente e o caller informa keys, o use case
     * lança `BadRequestError` (defesa em profundidade contra mis-injection).
     */
    private readonly fileUploadService?: Pick<FileUploadService, 'headObject'>,
  ) {}

  async execute(
    input: CreateSelfPunchApprovalRequest,
  ): Promise<CreateSelfPunchApprovalResponse> {
    if (!input.timeEntryId && !(input.proposedTimestamp && input.entryType)) {
      throw new BadRequestError(
        'timeEntryId OR (proposedTimestamp + entryType) é obrigatório',
      );
    }

    // Step A — resolve userId → Employee.id (tenant-scoped).
    const employee = await this.employeesRepository.findByUserId(
      new UniqueEntityID(input.userId),
      input.tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError(
        'Employee record not found for current user',
      );
    }
    const employeeId = employee.id.toString();

    // Step B — quando justificando batida existente, exige ownership.
    // Quando ausente (cenário 2 D-07), `timeEntryId` permanece null no DB —
    // gestor cria a TimeEntry real via correctionPayload no resolve (6-02).
    let resolvedTimeEntryId: string | null = null;
    if (input.timeEntryId) {
      if (!this.timeEntriesRepository) {
        throw new BadRequestError(
          'TimeEntriesRepository não foi injetado — não é possível validar ownership da batida.',
        );
      }
      const entry = await this.timeEntriesRepository.findById(
        new UniqueEntityID(input.timeEntryId),
        input.tenantId,
      );
      if (!entry) {
        throw new ResourceNotFoundError('TimeEntry não encontrada');
      }
      if (entry.employeeId.toString() !== employeeId) {
        throw new BadRequestError(
          'Cannot justify time entry that does not belong to you',
        );
      }
      resolvedTimeEntryId = input.timeEntryId;
    }

    // Step C — anti-spam D-08: máx 5 PENDING por employee.
    const pendingCount =
      await this.punchApprovalsRepository.countByEmployeeAndStatus(
        employeeId,
        'PENDING',
        input.tenantId,
      );
    if (pendingCount >= MAX_PENDING_PER_EMPLOYEE) {
      throw new BadRequestError(
        `Too many pending approvals (max ${MAX_PENDING_PER_EMPLOYEE}). Aguarde resolução das anteriores.`,
      );
    }

    // Step D — valida evidenceFileKeys via S3 headObject (anti phantom-keys).
    if (input.evidenceFileKeys && input.evidenceFileKeys.length > 0) {
      if (!this.fileUploadService) {
        throw new BadRequestError(
          'evidenceFileKeys informados, mas FileUploadService não foi injetado.',
        );
      }
      for (const key of input.evidenceFileKeys) {
        const head: HeadObjectResult | null =
          await this.fileUploadService.headObject(key);
        if (!head) {
          throw new EvidenceFileNotFoundError(key);
        }
      }
    }

    // Step E — montar `details` JSONB.
    const details: Record<string, unknown> = {
      // Indica origem PWA pessoal (gestor distingue na UI).
      origin: 'EMPLOYEE_SELF_REQUEST',
    };
    if (input.proposedTimestamp && input.entryType) {
      details.proposedTimestamp = input.proposedTimestamp;
      details.proposedEntryType = input.entryType;
    }

    // Step F — criar agregado e persistir.
    const approval = PunchApproval.create({
      tenantId: new UniqueEntityID(input.tenantId),
      timeEntryId: resolvedTimeEntryId
        ? new UniqueEntityID(resolvedTimeEntryId)
        : null,
      employeeId: new UniqueEntityID(employeeId),
      reason: input.reason,
      details,
      resolverNote: input.note,
    });

    // Anexar evidências via método dedicado (preserva audit trail e shape
    // restrita do EvidenceFile entity).
    if (input.evidenceFileKeys && input.evidenceFileKeys.length > 0) {
      const nowIso = new Date().toISOString();
      for (const key of input.evidenceFileKeys) {
        approval.attachEvidence({
          storageKey: key,
          filename: key.split('/').pop() ?? 'evidence',
          // Tamanho real foi validado no headObject acima — usamos 0 aqui
          // porque o controller não precisa do byte-count para o response;
          // o gestor verá o tamanho real ao baixar via presigned URL.
          size: 0,
          uploadedAt: nowIso,
          uploadedBy: input.userId,
        });
      }
    }

    await this.punchApprovalsRepository.create(approval);

    return {
      approvalId: approval.id.toString(),
      status: 'PENDING',
      createdAt: approval.createdAt.toISOString(),
    };
  }
}
