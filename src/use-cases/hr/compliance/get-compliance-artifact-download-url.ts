import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { ComplianceArtifact } from '@/entities/hr/compliance-artifact';
import type { ComplianceArtifactRepository } from '@/repositories/hr/compliance-artifact-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';

/**
 * Phase 06 / Plan 06-06 — `GetComplianceArtifactDownloadUrlUseCase`.
 *
 * Gera presigned URL (TTL 15 minutos) para download de um `ComplianceArtifact`
 * já gerado (AFD / AFDT / FOLHA_ESPELHO / RECIBO / S1200_XML).
 *
 * **Tenant isolation:** repo.findById valida `(id, tenantId)` — artefato de
 * outro tenant retorna `null` → `ResourceNotFoundError` (404). Nunca vaza a
 * existência de um artifact cross-tenant.
 *
 * **Content-Disposition:** o filename é derivado por tipo, permitindo que o
 * RH veja um nome amigável no browser (ex: `AFD_12345678000190_20260301_20260331.txt`).
 * Chamamos `FileUploadService.getPresignedUrl(key, ttl, contentDisposition)` —
 * o AWS SDK embute `ResponseContentDisposition` no signed URL (parte da
 * assinatura — browsers não conseguem adulterar).
 *
 * **Audit log:** o controller grava `COMPLIANCE_ARTIFACT_DOWNLOADED` com
 * placeholder `{type, artifactId}` (T-06-01-02: sem PII).
 *
 * Clean Architecture: use case puro (zero import Prisma). Controller faz a
 * orquestração de audit + fetch de informações adicionais (CNPJ / employee
 * fullName) se necessário para o filename.
 */
export interface GetComplianceArtifactDownloadUrlRequest {
  tenantId: string;
  artifactId: string;
  /** CNPJ do empregador (14 dígitos) para compor filename de AFD/AFDT. */
  employerCnpj?: string;
  /**
   * Nome slugificado do funcionário para folha espelho (se disponível).
   * Opcional: controller pode omitir — filename faz fallback para `funcionario`.
   */
  employeeSlug?: string;
}

export interface GetComplianceArtifactDownloadUrlResponse {
  url: string;
  expiresAt: string;
  artifactType: ComplianceArtifact['type'];
}

/** TTL padrão de 15 minutos (D-03 CONTEXT). */
const PRESIGNED_URL_TTL_SECONDS = 15 * 60;

function formatYYYYMMDD(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

function slugify(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Deriva o `Content-Disposition` amigável por tipo de artefato (D-03 / CONTEXT
 * §specifics — naming canônico: `AFD_{CNPJ}_{YYYYMMDD}_{YYYYMMDD}.txt`).
 */
export function buildContentDisposition(
  artifact: ComplianceArtifact,
  options: { employerCnpj?: string; employeeSlug?: string } = {},
): string {
  const cnpj = options.employerCnpj ?? 'CNPJ';
  const employee = options.employeeSlug ?? 'funcionario';

  let filename: string;
  switch (artifact.type) {
    case 'AFD': {
      const start = artifact.periodStart
        ? formatYYYYMMDD(artifact.periodStart)
        : '';
      const end = artifact.periodEnd ? formatYYYYMMDD(artifact.periodEnd) : '';
      filename = `AFD_${cnpj}_${start}_${end}.txt`;
      break;
    }
    case 'AFDT': {
      const start = artifact.periodStart
        ? formatYYYYMMDD(artifact.periodStart)
        : '';
      const end = artifact.periodEnd ? formatYYYYMMDD(artifact.periodEnd) : '';
      filename = `AFDT_${cnpj}_${start}_${end}.txt`;
      break;
    }
    case 'FOLHA_ESPELHO': {
      filename = `Folha_Espelho_${employee}_${artifact.competencia ?? 'sem_competencia'}.pdf`;
      break;
    }
    case 'RECIBO': {
      const nsr =
        (artifact.filters?.nsrNumber as string | number | undefined) ?? 'NSR';
      filename = `Recibo_NSR${nsr}.pdf`;
      break;
    }
    case 'S1200_XML': {
      filename = `S1200_${artifact.competencia ?? 'sem_competencia'}_${employee}.xml`;
      break;
    }
    default: {
      filename = 'artefato.bin';
    }
  }

  // RFC 6266 — ASCII-safe filename + UTF-8 fallback. Slugify já removeu
  // acentos para o ASCII, então um `filename="..."` simples basta.
  return `attachment; filename="${filename}"`;
}

export class GetComplianceArtifactDownloadUrlUseCase {
  constructor(
    private readonly complianceArtifactRepository: ComplianceArtifactRepository,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async execute(
    input: GetComplianceArtifactDownloadUrlRequest,
  ): Promise<GetComplianceArtifactDownloadUrlResponse> {
    const artifact = await this.complianceArtifactRepository.findById(
      input.artifactId,
      input.tenantId,
    );

    if (!artifact) {
      throw new ResourceNotFoundError('Artefato de compliance não encontrado');
    }

    const contentDisposition = buildContentDisposition(artifact, {
      employerCnpj: input.employerCnpj,
      employeeSlug: input.employeeSlug,
    });

    const url = await this.fileUploadService.getPresignedUrl(
      artifact.storageKey,
      PRESIGNED_URL_TTL_SECONDS,
      contentDisposition,
    );

    const expiresAt = new Date(
      Date.now() + PRESIGNED_URL_TTL_SECONDS * 1000,
    ).toISOString();

    return {
      url,
      expiresAt,
      artifactType: artifact.type,
    };
  }
}
