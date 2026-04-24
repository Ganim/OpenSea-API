import { randomUUID } from 'node:crypto';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { FileUploadService } from '@/services/storage/file-upload-service';

/**
 * Phase 7 / Plan 07-03 — D-10: upload de evidência PDF para resolução de
 * exceção com justificativa.
 *
 * Gera a storageKey deterministicamente (prefix por tenant + approvalId)
 * para facilitar garbage-collection futura (Phase 9 retention) — key inclui
 * UUID aleatório para evitar sobrescrita e permitir múltiplas evidências
 * por aprovação.
 *
 * O uso case NÃO persiste a storageKey no DB — a anexação ao PunchApproval
 * ocorre no `ResolvePunchApprovalUseCase` (passo 2 do fluxo 2-step).
 * Fluxo:
 *  1. Gestor sobe PDF via POST `/v1/hr/punch-approvals/:id/evidence`
 *     (este use case) → recebe storageKey + size.
 *  2. Gestor envia storageKey em `evidenceFileKeys` ao resolver ou
 *     batch-resolver — `resolve-punch-approval.ts` valida via headObject
 *     e anexa à entity via `attachEvidence()`.
 *
 * Defesas:
 *  - mimeType obrigatório = `application/pdf` (client pode enviar
 *    `application/octet-stream` em alguns browsers — Pitfall aceito Phase 7
 *    T-7-03-02: o header MIME é a fonte da verdade; magic-byte check fica
 *    pra Phase 9 antifraude).
 *  - Limite 10MB (PDFs de atestados raramente passam de 2MB; 10MB é
 *    margem generosa sem abrir DoS).
 *  - CacheControl `private, max-age=0, no-store` — documentos LGPD-sensíveis.
 *  - Metadata x-tenant-id/x-approval-id/x-uploaded-by para audit reverso.
 */
const MAX_EVIDENCE_SIZE = 10 * 1024 * 1024; // 10MB
const EVIDENCE_MIME_TYPE = 'application/pdf';

export interface UploadPunchApprovalEvidenceRequest {
  tenantId: string;
  approvalId: string;
  uploadedBy: string;
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface UploadPunchApprovalEvidenceResponse {
  storageKey: string;
  size: number;
  uploadedAt: string;
  filename: string;
}

export class UploadPunchApprovalEvidenceUseCase {
  constructor(
    private readonly fileUploadService: Pick<
      FileUploadService,
      'uploadWithKey'
    >,
  ) {}

  async execute(
    input: UploadPunchApprovalEvidenceRequest,
  ): Promise<UploadPunchApprovalEvidenceResponse> {
    if (input.mimeType !== EVIDENCE_MIME_TYPE) {
      throw new BadRequestError(
        `Apenas PDF permitido (${EVIDENCE_MIME_TYPE}); recebido ${input.mimeType}.`,
      );
    }
    if (input.buffer.byteLength > MAX_EVIDENCE_SIZE) {
      throw new BadRequestError(
        `Arquivo excede ${MAX_EVIDENCE_SIZE / (1024 * 1024)}MB.`,
      );
    }
    if (input.buffer.byteLength === 0) {
      throw new BadRequestError('Arquivo vazio.');
    }

    const storageKey = `${input.tenantId}/punch-approvals/${input.approvalId}/evidence/${randomUUID()}.pdf`;

    await this.fileUploadService.uploadWithKey(input.buffer, storageKey, {
      mimeType: EVIDENCE_MIME_TYPE,
      cacheControl: 'private, max-age=0, no-store',
      metadata: {
        'x-tenant-id': input.tenantId,
        'x-approval-id': input.approvalId,
        'x-uploaded-by': input.uploadedBy,
      },
    });

    return {
      storageKey,
      size: input.buffer.byteLength,
      uploadedAt: new Date().toISOString(),
      filename: input.filename,
    };
  }
}
