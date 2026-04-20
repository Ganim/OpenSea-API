import { createHash, randomUUID } from 'node:crypto';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ComplianceArtifact } from '@/entities/hr/compliance-artifact';
import {
  buildAfd,
  type AfdBuildInput,
  type AfdEmpregado,
  type AfdEmpresa,
  type AfdMarcacao,
} from '@/lib/compliance/afd-builder';
import type { ComplianceArtifactRepository } from '@/repositories/hr/compliance-artifact-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';

/**
 * Phase 06 / Plan 06-02 — `GenerateAfdUseCase`.
 *
 * Orquestra a geração do AFD (Portaria MTP 671/2021 Anexo I, REP-P) a partir
 * de uma janela de batidas + filtros opcionais (filial CNPJ, departamentos).
 * Persiste o blob no R2 com chave determinística + grava `ComplianceArtifact`
 * com `contentHash SHA-256` (lock contra mutação silenciosa).
 *
 * **Imutabilidade do AFD (D-01):** o use case filtra `adjustmentType=ORIGINAL`
 * — batidas com `ADJUSTMENT_APPROVED` (correções aprovadas) NÃO entram aqui.
 * Para o artefato consolidado com correções, use `GenerateAfdtUseCase`.
 *
 * **Audit trail:** o caller (controller) é quem registra `logAudit` com
 * `entity=COMPLIANCE_ARTIFACT, action=COMPLIANCE_GENERATE` — este use case
 * apenas retorna o `artifactId` para que o controller passe nos placeholders
 * (T-06-01-02 mitigation: nenhum PII vai para o audit description).
 *
 * **Validação de período (D-02):** janela máxima 365 dias; se exceder,
 * lança `BadRequestError` que o controller mapeia para 400.
 *
 * **Storage key determinística (D-03):** `{tenantId}/compliance/afd/{YYYY}/{MM}/{artifactId}.txt`
 * — usar `uploadWithKey` para que a chave do blob bata 1:1 com `ComplianceArtifact.storageKey`.
 *
 * Note that this use case TAKES the data already resolved (header/empresas/
 * empregados/marcacoes) — resolver tenant + employees + time entries fica a
 * cargo do controller (que tem acesso direto ao Prisma) ou de um wrapper de
 * orquestração futuro. Manter o use case puro facilita testes unit (todo o
 * input vira fixture).
 */

export type GenerateComplianceArtifactKind = 'AFD' | 'AFDT';

export interface GenerateAfdRequest {
  tenantId: string;
  generatedBy: string;
  /** Início da janela inclusivo (date-only). */
  startDate: Date;
  /** Fim da janela inclusivo. */
  endDate: Date;
  /** Filtros opcionais — guardados em `ComplianceArtifact.filters` para audit. */
  cnpj?: string;
  departmentIds?: string[];
  employeeId?: string;
  /** Dataset já resolvido (controller faz o fetch). */
  dataset: AfdBuildInput;
}

export interface GenerateAfdResponse {
  artifactId: string;
  storageKey: string;
  contentHash: string;
  sizeBytes: number;
  /** Presigned URL com TTL — controller decide se devolve no body ou redirect. */
  downloadUrl: string;
}

const MAX_PERIOD_DAYS = 365;
const PRESIGNED_TTL_SECONDS = 15 * 60; // 15 min — Portaria não exige TTL específica; balance entre RH baixar e revogação.
const AFD_MIME_TYPE = 'text/plain; charset=iso-8859-1';

export class GenerateAfdUseCase {
  constructor(
    private readonly complianceArtifactRepository: ComplianceArtifactRepository,
    private readonly fileUploadService: FileUploadService,
    /**
     * Tipo do artefato — `AFD` (default, batidas ORIGINAL apenas) ou `AFDT`
     * (proprietário, inclui ADJUSTMENT_APPROVED). Subclasse `GenerateAfdtUseCase`
     * (em arquivo separado) instancia com `kind='AFDT'`.
     */
    private readonly kind: GenerateComplianceArtifactKind = 'AFD',
  ) {}

  async execute(input: GenerateAfdRequest): Promise<GenerateAfdResponse> {
    this.validatePeriod(input.startDate, input.endDate);

    // Filtra adjustments para AFD bruto (D-01); inclui para AFDT.
    const includeAdjustments = this.kind === 'AFDT';
    const filteredMarcacoes = this.filterMarcacoes(
      input.dataset.marcacoes,
      includeAdjustments,
    );
    const dataset: AfdBuildInput = {
      ...input.dataset,
      marcacoes: filteredMarcacoes,
    };

    // Build buffer (byte-perfect ISO-8859-1 + CRLF + CRC + SHA chain).
    const buffer = buildAfd(dataset, { includeAdjustments });
    const contentHash = createHash('sha256').update(buffer).digest('hex');
    const sizeBytes = buffer.length;

    // Storage key determinística — usa o year/month da geração para
    // particionar por mês (facilita lifecycle policies do R2).
    const artifactId = randomUUID();
    const generatedAt = new Date();
    const storageKey = this.buildStorageKey({
      tenantId: input.tenantId,
      kind: this.kind,
      generatedAt,
      artifactId,
    });

    await this.fileUploadService.uploadWithKey(buffer, storageKey, {
      mimeType: AFD_MIME_TYPE,
      cacheControl: 'private, max-age=0, no-store',
      metadata: {
        'x-tenant-id': input.tenantId,
        'x-artifact-kind': this.kind,
        'x-content-sha256': contentHash,
      },
    });

    const artifact = ComplianceArtifact.create(
      {
        tenantId: new UniqueEntityID(input.tenantId),
        type: this.kind,
        periodStart: input.startDate,
        periodEnd: input.endDate,
        filters: this.buildFilters(input),
        storageKey,
        contentHash,
        sizeBytes,
        generatedBy: new UniqueEntityID(input.generatedBy),
        generatedAt,
      },
      new UniqueEntityID(artifactId),
    );
    await this.complianceArtifactRepository.create(artifact);

    const downloadUrl = await this.fileUploadService.getPresignedUrl(
      storageKey,
      PRESIGNED_TTL_SECONDS,
    );

    return {
      artifactId,
      storageKey,
      contentHash,
      sizeBytes,
      downloadUrl,
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private validatePeriod(startDate: Date, endDate: Date) {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestError('Datas inválidas — use AAAA-MM-DD.');
    }
    const diffMs = endDate.getTime() - startDate.getTime();
    if (diffMs < 0) {
      throw new BadRequestError('endDate deve ser ≥ startDate.');
    }
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > MAX_PERIOD_DAYS) {
      throw new BadRequestError(
        `Período máximo permitido é ${MAX_PERIOD_DAYS} dias (recebido ${Math.floor(diffDays)}). Divida em chunks.`,
      );
    }
  }

  private filterMarcacoes(
    marcacoes: AfdMarcacao[],
    includeAdjustments: boolean,
  ): AfdMarcacao[] {
    if (includeAdjustments) {
      return marcacoes;
    }
    return marcacoes.filter((m) => m.adjustmentType !== 'ADJUSTMENT_APPROVED');
  }

  private buildStorageKey(params: {
    tenantId: string;
    kind: GenerateComplianceArtifactKind;
    generatedAt: Date;
    artifactId: string;
  }): string {
    const year = params.generatedAt.getUTCFullYear();
    const month = String(params.generatedAt.getUTCMonth() + 1).padStart(2, '0');
    const folder = params.kind.toLowerCase();
    return `${params.tenantId}/compliance/${folder}/${year}/${month}/${params.artifactId}.txt`;
  }

  private buildFilters(
    input: GenerateAfdRequest,
  ): Record<string, unknown> | undefined {
    const filters: Record<string, unknown> = {};
    if (input.cnpj) filters.cnpj = input.cnpj;
    if (input.departmentIds?.length)
      filters.departmentIds = input.departmentIds;
    if (input.employeeId) filters.employeeId = input.employeeId;
    // Counts also go in filters for quick re-display in the dashboard
    // (T-06-01-02: only counts, no PII).
    filters.empresasCount = input.dataset.empresas.length;
    filters.empregadosCount = input.dataset.empregados.length;
    filters.marcacoesTotal = input.dataset.marcacoes.length;
    return Object.keys(filters).length > 0 ? filters : undefined;
  }
}

// Re-export builder types so factories/specs can mount fixtures without
// importing from the lib layer directly (clean architecture: use cases
// surface their own input shape).
export type { AfdBuildInput, AfdEmpregado, AfdEmpresa, AfdMarcacao };
