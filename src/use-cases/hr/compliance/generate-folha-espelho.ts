/**
 * GenerateFolhaEspelhoUseCase — Phase 06 / Plan 06-04
 *
 * Gera folha espelho mensal PDF (A4 CLT) individual síncrono para 1
 * funcionário + competência. Target de performance: < 5s em tenant típico
 * (22 dias úteis com batidas, sem ML/processamento pesado).
 *
 * **Fluxo:**
 *  1. Valida competencia `/^\d{4}-\d{2}$/` (senão BadRequestError).
 *  2. Fetch Employee (valida tenant match — senão NotFoundError).
 *  3. Chama `TimeBankConsolidationAdapter.getByEmployeeAndPeriod` — nunca
 *     lança por dados faltantes (warnings em dataQuality).
 *  4. Monta `FolhaEspelhoPdfData` combinando tenant + employee + consolidação.
 *  5. Renderiza PDF via `renderFolhaEspelhoPdf`.
 *  6. Upload R2 com chave determinística
 *     `{tenantId}/compliance/folha-espelho/{YYYY}/{MM}/{artifactId}.pdf`.
 *  7. Cria `ComplianceArtifact(type=FOLHA_ESPELHO, competencia,
 *     filters={employeeId}, storageKey, contentHash, sizeBytes)`.
 *  8. Retorna `{ artifactId, downloadUrl, sizeBytes, contentHash }`.
 *
 * **Clean Architecture:** o use case aceita repositórios + service injetados
 * (in-memory via factory em specs); zero import de Prisma. Fetch do Employee
 * é via `EmployeesRepository.findById(employeeId, tenantId)` que retorna
 * null cross-tenant (mitigação T-06-04-01 / T-06-04-08).
 *
 * **Tenant data:** `tenantName`, `tenantCnpj`, `tenantAddress` vêm em
 * `GenerateFolhaEspelhoInput` já resolvidos pelo controller (que tem acesso
 * direto ao Prisma) — mesma orquestração de AFD/AFDT (Plan 06-02).
 */

import { createHash, randomUUID } from 'node:crypto';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ComplianceArtifact } from '@/entities/hr/compliance-artifact';
import { renderFolhaEspelhoPdf } from '@/lib/pdf/folha-espelho-renderer';
import type { ComplianceArtifactRepository } from '@/repositories/hr/compliance-artifact-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';

import type { TimeBankConsolidationAdapter } from './time-bank-consolidation-adapter';

export interface GenerateFolhaEspelhoInput {
  tenantId: string;
  generatedBy: string;
  employeeId: string;
  /** Competência em formato YYYY-MM (ex: '2026-03'). */
  competencia: string;
  /** Dados do tenant já resolvidos pelo controller. */
  tenantContext: {
    razaoSocial: string;
    cnpj: string;
    endereco?: string;
    inscricaoMunicipal?: string;
    logoBuffer?: Buffer;
  };
}

export interface GenerateFolhaEspelhoOutput {
  artifactId: string;
  storageKey: string;
  contentHash: string;
  sizeBytes: number;
  downloadUrl: string;
}

const COMPETENCIA_REGEX = /^\d{4}-\d{2}$/;
const PDF_MIME_TYPE = 'application/pdf';
const PRESIGNED_TTL_SECONDS = 15 * 60;

export class GenerateFolhaEspelhoUseCase {
  constructor(
    private readonly employeeRepo: EmployeesRepository,
    private readonly consolidationAdapter: TimeBankConsolidationAdapter,
    private readonly complianceRepo: ComplianceArtifactRepository,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async execute(
    input: GenerateFolhaEspelhoInput,
  ): Promise<GenerateFolhaEspelhoOutput> {
    if (!COMPETENCIA_REGEX.test(input.competencia)) {
      throw new BadRequestError(
        `competência inválida — use o formato YYYY-MM (recebido: "${input.competencia}")`,
      );
    }

    // ── 1. Fetch Employee com validação tenant-scoped ─────────────────
    const employee = await this.employeeRepo.findById(
      new UniqueEntityID(input.employeeId),
      input.tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado.');
    }

    // ── 2. Consolidação mensal (fallback gracioso) ─────────────────────
    const consolidation =
      await this.consolidationAdapter.getByEmployeeAndPeriod(
        input.employeeId,
        input.competencia,
        input.tenantId,
      );

    // ── 3. Monta dados do PDF ──────────────────────────────────────────
    const competenciaDisplay = formatCompetencia(input.competencia);
    const pdfBuffer = await renderFolhaEspelhoPdf({
      tenant: input.tenantContext,
      employee: {
        fullName: employee.fullName,
        registrationNumber: employee.registrationNumber ?? '-',
        cpf: employee.cpf.value,
        position: employee.positionId?.toString() ?? 'Não informado',
        department: employee.departmentId?.toString() ?? 'Não informado',
        hireDate: employee.hireDate ?? new Date(0),
        weeklyHoursContracted: employee.weeklyHours ?? 0,
      },
      competencia: competenciaDisplay,
      consolidation,
      generatedAt: new Date(),
    });

    // ── 4. Upload R2 + persistência ComplianceArtifact ────────────────
    const contentHash = createHash('sha256').update(pdfBuffer).digest('hex');
    const sizeBytes = pdfBuffer.length;
    const artifactId = randomUUID();
    const [year, month] = input.competencia.split('-');
    const storageKey = `${input.tenantId}/compliance/folha-espelho/${year}/${month}/${artifactId}.pdf`;

    await this.fileUploadService.uploadWithKey(pdfBuffer, storageKey, {
      mimeType: PDF_MIME_TYPE,
      cacheControl: 'private, max-age=0, no-store',
      metadata: {
        'x-tenant-id': input.tenantId,
        'x-artifact-kind': 'FOLHA_ESPELHO',
        'x-competencia': input.competencia,
        'x-employee-id': input.employeeId,
        'x-content-sha256': contentHash,
      },
    });

    const artifact = ComplianceArtifact.create(
      {
        tenantId: new UniqueEntityID(input.tenantId),
        type: 'FOLHA_ESPELHO',
        competencia: input.competencia,
        filters: { employeeId: input.employeeId },
        storageKey,
        contentHash,
        sizeBytes,
        generatedBy: new UniqueEntityID(input.generatedBy),
        generatedAt: new Date(),
      },
      new UniqueEntityID(artifactId),
    );
    await this.complianceRepo.create(artifact);

    const downloadUrl = await this.fileUploadService.getPresignedUrl(
      storageKey,
      PRESIGNED_TTL_SECONDS,
    );

    return { artifactId, storageKey, contentHash, sizeBytes, downloadUrl };
  }
}

function formatCompetencia(competencia: string): string {
  const [year, month] = competencia.split('-');
  return `${month}/${year}`;
}
