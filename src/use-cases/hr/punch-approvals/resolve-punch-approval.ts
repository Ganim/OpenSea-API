import { randomUUID } from 'node:crypto';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { EvidenceFileNotFoundError } from '@/@errors/use-cases/evidence-file-not-found-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimeEntryType } from '@/entities/hr/value-objects';
import type { TypedEventBus } from '@/lib/events';
import { PUNCH_EVENTS } from '@/lib/events/punch-events';
import type {
  PunchTimeEntryCreatedData,
  PunchApprovalResolvedData,
} from '@/lib/events/punch-events';
import type { PunchApprovalsRepository } from '@/repositories/hr/punch-approvals-repository';
import type { TimeEntriesRepository } from '@/repositories/hr/time-entries-repository';
import type {
  FileUploadService,
  HeadObjectResult,
} from '@/services/storage/file-upload-service';

export type ResolveDecision = 'APPROVE' | 'REJECT';

/**
 * Phase 06 / Plan 06-02 (PUNCH-COMPLIANCE-07).
 *
 * Quando o gestor aprova uma `PunchApproval` PENDING **e** quer corrigir o
 * conteúdo da batida original (timestamp errado, entryType invertido,
 * justificativa, ...), ele envia este payload junto com `decision=APPROVE`.
 *
 * O comportamento garantido:
 *  - O `TimeEntry` original NUNCA é mutado (NSR é imutável após gravação,
 *    Portaria 671 Anexo III).
 *  - Uma NOVA linha é gravada via `TimeEntriesRepository.createAdjustment` com
 *    `adjustmentType=ADJUSTMENT_APPROVED` + `originNsrNumber=<NSR original>`.
 *  - O NSR alocado para a correção é gravado em
 *    `PunchApproval.details.correctionNsr` para posterior rastreabilidade
 *    (UI mostra "→ corrigido pelo NSR XX").
 *  - O evento `PUNCH_EVENTS.TIME_ENTRY_CREATED` é emitido para a nova entry
 *    (workers downstream — recibo HMAC, eSocial S-1200 — tratam ela como
 *    qualquer batida nova, com NSR próprio).
 */
export interface ResolvePunchCorrectionPayload {
  /** Novo timestamp corrigido pelo gestor. */
  timestamp: Date;
  /** Tipo corrigido (gestor pode trocar IN→OUT, BREAK_START→BREAK_END, ...). */
  entryType: 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END';
  /** Nota descrevendo a justificativa da correção (vai parar em TimeEntry.notes). */
  note?: string;
}

export interface ResolvePunchApprovalRequest {
  tenantId: string;
  approvalId: string;
  decision: ResolveDecision;
  resolverUserId: string;
  note?: string;
  /**
   * Plan 06-02: payload opcional que ativa o fluxo de correção. Só é
   * processado quando `decision === 'APPROVE'`. Em REJECT é silenciosamente
   * ignorado (rejeição não cria correção — o gestor rejeita justamente para
   * descartar a batida).
   */
  correctionPayload?: ResolvePunchCorrectionPayload;
  /**
   * Phase 7 / Plan 07-03 — D-10. Lista de storageKeys (PDFs já enviadas para
   * o S3 via `UploadPunchApprovalEvidenceUseCase` num passo separado). Cada
   * key é validada via `s3.headObject` antes de ser anexada ao PunchApproval
   * — phantom keys (client-side forgery) são rejeitadas com
   * `EvidenceFileNotFoundError`.
   */
  evidenceFileKeys?: string[];
  /**
   * Phase 7 / Plan 07-03 — D-10. ID opcional de um `EmployeeRequest` aprovado
   * que cobre a ausência (ex.: atestado médico). FK nullable — se o request
   * for removido, `linkedRequestId` vira `null` via `ON DELETE SET NULL`.
   */
  linkedRequestId?: string;
}

export interface ResolvePunchApprovalResponse {
  approvalId: string;
  status: 'APPROVED' | 'REJECTED';
  resolvedAt: string;
  /**
   * Quando há `correctionPayload` aprovado: NSR + ID do TimeEntry novo
   * criado. UI exibe "Correção aplicada (NSR XX → YY)" no toast de sucesso.
   */
  correctionNsr?: number;
  correctionTimeEntryId?: string;
}

/**
 * Gestor resolve (aprovar ou rejeitar) uma PunchApproval PENDING.
 *
 * Flow base (Phase 04-03):
 *   findById → validate decision → delegate state transition para a entity
 *   → repo.save → retorna DTO leve com status + resolvedAt ISO.
 *
 * Flow estendido (Phase 06-02 / PUNCH-COMPLIANCE-07): quando `decision=APPROVE`
 * + `correctionPayload`, alocar NSR sequencial novo via
 * `TimeEntriesRepository.createAdjustment`, anotar `correctionNsr` em
 * `PunchApproval.details`, salvar e emitir `PUNCH_EVENTS.TIME_ENTRY_CREATED`
 * para o novo TimeEntry. NSR original permanece intacto.
 *
 * Double-resolve: a entity lança `Error`; este use case traduz para
 * `BadRequestError` para o controller mapear como 400.
 */
export class ResolvePunchApprovalUseCase {
  constructor(
    private readonly punchApprovalsRepository: PunchApprovalsRepository,
    /**
     * Plan 06-02: opcional para preservar compat com call sites legados
     * (o factory base `make-resolve-punch-approval-use-case` continua sem
     * passar). Quando ausente, `correctionPayload` no request lança 400.
     * Use o factory `make-resolve-punch-approval-with-correction` para
     * habilitar o fluxo de correção (controller HTTP futuro).
     */
    private readonly timeEntriesRepository?: TimeEntriesRepository,
    /**
     * Bus tipado para emissão de eventos pós-correção. Igualmente opcional
     * por compat — quando ausente e o caller pediu correção, falha imediata.
     */
    private readonly eventBus?: TypedEventBus,
    /**
     * Phase 7 / Plan 07-03 — D-10. File upload service para validar
     * `evidenceFileKeys` via `headObject` antes de anexar ao PunchApproval.
     * Opcional por compat; se ausente e o caller enviar `evidenceFileKeys`,
     * `BadRequestError` é lançado.
     */
    private readonly fileUploadService?: Pick<FileUploadService, 'headObject'>,
  ) {}

  async execute(
    input: ResolvePunchApprovalRequest,
  ): Promise<ResolvePunchApprovalResponse> {
    if (input.decision !== 'APPROVE' && input.decision !== 'REJECT') {
      throw new BadRequestError('decision deve ser APPROVE ou REJECT');
    }

    if (input.correctionPayload && input.decision !== 'APPROVE') {
      throw new BadRequestError(
        'correctionPayload só é válido com decision=APPROVE.',
      );
    }

    const approval = await this.punchApprovalsRepository.findById(
      new UniqueEntityID(input.approvalId),
      input.tenantId,
    );

    if (!approval) {
      throw new ResourceNotFoundError('Aprovação não encontrada');
    }

    // Plan 06-02: gate de capabilities — chamar correção sem ter passado
    // `timeEntriesRepository` no constructor é programmer error. Falhar com
    // 400 (não 500) porque o caller controla o input.
    if (input.correctionPayload && !this.timeEntriesRepository) {
      throw new BadRequestError(
        'Fluxo de correção (PUNCH-COMPLIANCE-07) não disponível neste use case — instancie via makeResolvePunchApprovalWithCorrectionUseCase.',
      );
    }

    try {
      if (input.decision === 'APPROVE') {
        approval.resolve(input.resolverUserId, input.note);
      } else {
        approval.reject(input.resolverUserId, input.note);
      }
    } catch (err) {
      throw new BadRequestError(
        err instanceof Error ? err.message : 'Erro ao resolver aprovação',
      );
    }

    let correctionNsr: number | undefined;
    let correctionTimeEntryId: string | undefined;
    let timeEntryCreatedEventData: PunchTimeEntryCreatedData | undefined;

    if (input.correctionPayload && this.timeEntriesRepository) {
      // Aloca NSR novo + grava ADJUSTMENT_APPROVED. Repo enforce que a
      // origem existe + pertence ao tenant + tem NSR válido (lança Error
      // que traduzimos para BadRequest).
      try {
        const adjustment = await this.timeEntriesRepository.createAdjustment({
          originEntryId: approval.timeEntryId.toString(),
          tenantId: input.tenantId,
          employeeId: approval.employeeId,
          entryType: TimeEntryType.create(input.correctionPayload.entryType),
          timestamp: input.correctionPayload.timestamp,
          note: input.correctionPayload.note,
          resolverUserId: input.resolverUserId,
        });
        correctionNsr = adjustment.nsrNumber;
        correctionTimeEntryId = adjustment.timeEntry.id.toString();
        approval.mergeDetails({
          correctionNsr: adjustment.nsrNumber,
          correctionTimeEntryId,
          originNsrNumber: adjustment.originNsrNumber,
        });

        // Pré-monta o payload do evento agora; emissão pós-save (Pitfall 2
        // documentado em execute-punch.ts: nunca emitir antes da persistência).
        timeEntryCreatedEventData = {
          timeEntryId: correctionTimeEntryId,
          employeeId: approval.employeeId.toString(),
          entryType: input.correctionPayload.entryType,
          timestamp: input.correctionPayload.timestamp.toISOString(),
          nsrNumber: adjustment.nsrNumber,
          // Correção é por definição uma batida nova SEM aprovação pendente
          // (Portaria não exige re-aprovar; o evento de criação dispara o
          // recibo HMAC normalmente).
          hasApproval: false,
          punchDeviceId: null,
        };
      } catch (err) {
        throw new BadRequestError(
          err instanceof Error
            ? err.message
            : 'Falha ao criar correção da batida.',
        );
      }
    }

    // Phase 7 / Plan 07-03 — D-10: anexar evidências PDF + cross-ref a
    // EmployeeRequest (se fornecido). S3 headObject garante que as keys
    // apontam para objetos existentes (Warning #7: anti phantom keys).
    if (input.evidenceFileKeys && input.evidenceFileKeys.length > 0) {
      if (!this.fileUploadService) {
        throw new BadRequestError(
          'Evidência anexada, mas FileUploadService não foi injetado — use makeResolvePunchApprovalWithCorrectionUseCase ou makeBatchResolvePunchApprovalsUseCase.',
        );
      }
      for (const key of input.evidenceFileKeys) {
        const head: HeadObjectResult | null =
          await this.fileUploadService.headObject(key);
        if (!head) {
          throw new EvidenceFileNotFoundError(key);
        }
        approval.attachEvidence({
          storageKey: key,
          filename: key.split('/').pop() ?? 'evidence.pdf',
          size: head.contentLength,
          uploadedAt: new Date().toISOString(),
          uploadedBy: input.resolverUserId,
        });
      }
    }

    if (input.linkedRequestId) {
      approval.linkRequest(input.linkedRequestId);
    }

    await this.punchApprovalsRepository.save(approval);

    // Pós-commit: emitir eventos. Falhar a emissão NÃO desfaz a aprovação
    // (resolução já foi gravada). Logamos via console pois não há request
    // context aqui — o consumidor downstream (worker) vai reprocessar via
    // dead-letter se cair. Contract: evento at-least-once, idempotência
    // garantida pelo NSR único na tabela.
    if (timeEntryCreatedEventData && this.eventBus) {
      try {
        await this.eventBus.publish({
          id: randomUUID(),
          type: PUNCH_EVENTS.TIME_ENTRY_CREATED,
          version: 1,
          tenantId: input.tenantId,
          source: 'hr',
          sourceEntityType: 'time_entry',
          sourceEntityId: timeEntryCreatedEventData.timeEntryId,
          data: timeEntryCreatedEventData as unknown as Record<string, unknown>,
          metadata: { userId: input.resolverUserId },
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        // Documentação T-06-02-10 (accept): correção emite TIME_ENTRY_CREATED
        // como qualquer batida; bus offline não invalida o ponto, recibo é
        // gerado quando o worker reprocessa.
        console.error(
          '[resolve-punch-approval] falha ao emitir TIME_ENTRY_CREATED para correção',
          err,
        );
      }
    }

    if (this.eventBus) {
      // Evento padrão de resolução (consumidores: notificações para o
      // empregado, métricas RH). Já existia conceitualmente — sem regressão
      // em call sites legados, pois eventBus é opcional.
      try {
        const resolvedEventData: PunchApprovalResolvedData = {
          approvalId: approval.id.toString(),
          timeEntryId: approval.timeEntryId.toString(),
          employeeId: approval.employeeId.toString(),
          status: approval.status as 'APPROVED' | 'REJECTED',
          resolverUserId: input.resolverUserId,
          resolvedAt: approval.resolvedAt!.toISOString(),
        };
        await this.eventBus.publish({
          id: randomUUID(),
          type: PUNCH_EVENTS.APPROVAL_RESOLVED,
          version: 1,
          tenantId: input.tenantId,
          source: 'hr',
          sourceEntityType: 'punch_approval',
          sourceEntityId: approval.id.toString(),
          data: resolvedEventData as unknown as Record<string, unknown>,
          metadata: { userId: input.resolverUserId },
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error(
          '[resolve-punch-approval] falha ao emitir APPROVAL_RESOLVED',
          err,
        );
      }
    }

    return {
      approvalId: approval.id.toString(),
      status: approval.status as 'APPROVED' | 'REJECTED',
      // resolvedAt é garantido aqui — setado por resolve/reject imediatamente antes.
      resolvedAt: approval.resolvedAt!.toISOString(),
      ...(correctionNsr != null ? { correctionNsr } : {}),
      ...(correctionTimeEntryId ? { correctionTimeEntryId } : {}),
    };
  }
}
