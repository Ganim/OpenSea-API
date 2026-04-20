import { beforeEach, describe, expect, it } from 'vitest';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryComplianceArtifactRepository } from '@/repositories/hr/in-memory/in-memory-compliance-artifact-repository';
import type {
  FileUploadService,
  MultipartCompletePart,
  MultipartPartUrl,
  MultipartUploadInit,
  UploadOptions,
  UploadResult,
  UploadWithKeyOptions,
  UploadWithKeyResult,
} from '@/services/storage/file-upload-service';

import type { AfdBuildInput } from '@/lib/compliance/afd-builder';
import { GenerateAfdUseCase } from './generate-afd';

/**
 * Fake `FileUploadService` que registra chamadas de `uploadWithKey` para
 * inspeção e retorna URL determinística no `getPresignedUrl`. Não toca em
 * S3/R2 real — todo o teste roda 100% in-memory.
 */
class FakeFileUploadService implements FileUploadService {
  public uploads: Array<{
    key: string;
    body: Buffer;
    options: UploadWithKeyOptions;
  }> = [];

  async upload(
    _fileBuffer: Buffer,
    _fileName: string,
    _mimeType: string,
    _options: UploadOptions,
  ): Promise<UploadResult> {
    throw new Error('upload() não usado em GenerateAfdUseCase');
  }

  async uploadWithKey(
    fileBuffer: Buffer,
    key: string,
    options: UploadWithKeyOptions,
  ): Promise<UploadWithKeyResult> {
    this.uploads.push({ key, body: fileBuffer, options });
    return {
      key,
      bucket: 'fake-bucket',
      etag: '"fake-etag"',
      size: fileBuffer.length,
    };
  }

  async getPresignedUrl(key: string, expiresIn?: number): Promise<string> {
    return `https://fake-r2.test/${key}?ttl=${expiresIn ?? 3600}`;
  }

  async getObject(_key: string): Promise<Buffer> {
    throw new Error('getObject() não usado em GenerateAfdUseCase');
  }

  async delete(_key: string): Promise<void> {
    return;
  }

  async initiateMultipartUpload(
    _fileName: string,
    _mimeType: string,
    _options: UploadOptions,
  ): Promise<MultipartUploadInit> {
    throw new Error('initiateMultipartUpload() não usado');
  }

  async getPresignedPartUrls(
    _key: string,
    _uploadId: string,
    _totalParts: number,
  ): Promise<MultipartPartUrl[]> {
    throw new Error('getPresignedPartUrls() não usado');
  }

  async completeMultipartUpload(
    _key: string,
    _uploadId: string,
    _parts: MultipartCompletePart[],
  ): Promise<UploadResult> {
    throw new Error('completeMultipartUpload() não usado');
  }

  async abortMultipartUpload(_key: string, _uploadId: string): Promise<void> {
    return;
  }
}

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';

function buildDataset(opts?: { withAdjustment?: boolean }): AfdBuildInput {
  const dataset: AfdBuildInput = {
    header: {
      tpInsc: 1,
      nrInsc: '12345678000190',
      cno: '',
      razaoSocial: 'PANIFICADORA JOÃO & CIA LTDA',
      inpi: '99999999999999999',
      startDate: new Date('2026-03-01T00:00:00Z'),
      endDate: new Date('2026-03-03T00:00:00Z'),
      generatedAt: new Date('2026-04-20T13:30:00Z'),
      devTpInsc: 1,
      devInsc: '11222333000144',
      tz: '-0300',
    },
    empresas: [
      {
        nsr: 1,
        recordedAt: new Date('2026-03-01T11:00:00Z'),
        responsavelCpf: '11122233344',
        tpInsc: 1,
        nrInsc: '12345678000190',
        cno: '',
        razaoSocial: 'PANIFICADORA JOÃO & CIA LTDA',
        localPrestacao: 'Rua das Flores, 100, Centro, São Paulo/SP',
      },
    ],
    empregados: [
      {
        nsr: 2,
        recordedAt: new Date('2026-03-01T11:01:00Z'),
        operacao: 'I',
        cpf: '12345678900',
        nome: 'JOSÉ DA SILVA',
        responsavelCpf: '11122233344',
      },
    ],
    marcacoes: [
      {
        nsr: 3,
        punchAt: new Date('2026-03-01T11:02:00Z'),
        cpf: '12345678900',
        recordedAt: new Date('2026-03-01T11:02:15Z'),
        coletor: 2,
        online: 0,
        adjustmentType: 'ORIGINAL',
      },
      {
        nsr: 4,
        punchAt: new Date('2026-03-01T20:15:00Z'),
        cpf: '12345678900',
        recordedAt: new Date('2026-03-01T20:15:08Z'),
        coletor: 2,
        online: 0,
        adjustmentType: 'ORIGINAL',
      },
    ],
  };
  if (opts?.withAdjustment) {
    dataset.marcacoes.push({
      nsr: 5,
      punchAt: new Date('2026-03-01T11:30:00Z'),
      cpf: '12345678900',
      recordedAt: new Date('2026-03-02T09:00:00Z'),
      coletor: 2,
      online: 0,
      adjustmentType: 'ADJUSTMENT_APPROVED',
    });
  }
  return dataset;
}

let complianceRepo: InMemoryComplianceArtifactRepository;
let fileUpload: FakeFileUploadService;
let sut: GenerateAfdUseCase;

beforeEach(() => {
  complianceRepo = new InMemoryComplianceArtifactRepository();
  fileUpload = new FakeFileUploadService();
  sut = new GenerateAfdUseCase(complianceRepo, fileUpload);
});

describe('GenerateAfdUseCase — happy path', () => {
  it('gera artefato AFD, persiste no R2 com chave determinística e cria ComplianceArtifact', async () => {
    const startDate = new Date('2026-03-01T00:00:00Z');
    const endDate = new Date('2026-03-03T00:00:00Z');

    const result = await sut.execute({
      tenantId: TENANT_ID,
      generatedBy: USER_ID,
      startDate,
      endDate,
      cnpj: '12345678000190',
      dataset: buildDataset(),
    });

    // Resposta tem todos os campos esperados.
    expect(result.artifactId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(result.contentHash).toHaveLength(64);
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(result.downloadUrl).toContain(result.storageKey);

    // Storage key segue padrão {tenant}/compliance/afd/{YYYY}/{MM}/{id}.txt
    expect(result.storageKey).toMatch(
      new RegExp(
        `^${TENANT_ID}/compliance/afd/\\d{4}/\\d{2}/[0-9a-f-]+\\.txt$`,
      ),
    );

    // Upload foi feito com mime ISO-8859-1 e a chave determinística.
    expect(fileUpload.uploads).toHaveLength(1);
    expect(fileUpload.uploads[0].key).toBe(result.storageKey);
    expect(fileUpload.uploads[0].options.mimeType).toBe(
      'text/plain; charset=iso-8859-1',
    );
    expect(fileUpload.uploads[0].options.metadata).toMatchObject({
      'x-tenant-id': TENANT_ID,
      'x-artifact-kind': 'AFD',
      'x-content-sha256': result.contentHash,
    });

    // ComplianceArtifact persistido.
    const artifacts = complianceRepo.items;
    expect(artifacts).toHaveLength(1);
    const artifact = artifacts[0];
    expect(artifact.id.toString()).toBe(result.artifactId);
    expect(artifact.type).toBe('AFD');
    expect(artifact.contentHash).toBe(result.contentHash);
    expect(artifact.sizeBytes).toBe(result.sizeBytes);
    expect(artifact.storageKey).toBe(result.storageKey);
    expect(artifact.tenantId.toString()).toBe(TENANT_ID);
    expect(artifact.generatedBy.toString()).toBe(USER_ID);
    expect(artifact.periodStart?.toISOString()).toBe(startDate.toISOString());
    expect(artifact.periodEnd?.toISOString()).toBe(endDate.toISOString());

    // Filters guardam contadores agregados (sem PII bruto).
    expect(artifact.filters).toMatchObject({
      cnpj: '12345678000190',
      empresasCount: 1,
      empregadosCount: 1,
      marcacoesTotal: 2,
    });
  });
});

describe('GenerateAfdUseCase — D-01 imutabilidade do AFD', () => {
  it('NÃO inclui registros ADJUSTMENT_APPROVED no buffer (filter ORIGINAL apenas)', async () => {
    // Mesma janela com 1 ajuste extra → AFD bruto deve produzir buffer MENOR
    // que o AFDT (que inclui o ajuste).
    const baseSize = (
      await sut.execute({
        tenantId: TENANT_ID,
        generatedBy: USER_ID,
        startDate: new Date('2026-03-01T00:00:00Z'),
        endDate: new Date('2026-03-03T00:00:00Z'),
        dataset: buildDataset(),
      })
    ).sizeBytes;

    const sizeWithAdjustmentInDataset = (
      await sut.execute({
        tenantId: TENANT_ID,
        generatedBy: USER_ID,
        startDate: new Date('2026-03-01T00:00:00Z'),
        endDate: new Date('2026-03-03T00:00:00Z'),
        dataset: buildDataset({ withAdjustment: true }),
      })
    ).sizeBytes;

    // Mesmo tamanho — AFD filtra ADJUSTMENT_APPROVED, então o ajuste extra
    // no dataset NÃO afeta o output (PUNCH-COMPLIANCE-07 garantido).
    expect(sizeWithAdjustmentInDataset).toBe(baseSize);
  });
});

describe('GenerateAfdUseCase — validação de período', () => {
  it('lança BadRequestError quando endDate - startDate > 365 dias', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        generatedBy: USER_ID,
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2026-03-01T00:00:00Z'), // ~424 dias
        dataset: buildDataset(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('lança BadRequestError quando endDate < startDate', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        generatedBy: USER_ID,
        startDate: new Date('2026-03-10T00:00:00Z'),
        endDate: new Date('2026-03-01T00:00:00Z'),
        dataset: buildDataset(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('aceita janela exata de 365 dias (boundary inclusivo)', async () => {
    const start = new Date('2025-04-20T00:00:00Z');
    const end = new Date('2026-04-20T00:00:00Z'); // 365 dias exatos
    const result = await sut.execute({
      tenantId: TENANT_ID,
      generatedBy: USER_ID,
      startDate: start,
      endDate: end,
      dataset: buildDataset(),
    });
    expect(result.artifactId).toBeTruthy();
  });
});

describe('GenerateAfdUseCase — content hash & integridade', () => {
  it('hash SHA-256 é deterministicamente derivado do buffer (geração idêntica → mesmo hash)', async () => {
    const dataset = buildDataset();
    const r1 = await sut.execute({
      tenantId: TENANT_ID,
      generatedBy: USER_ID,
      startDate: new Date('2026-03-01T00:00:00Z'),
      endDate: new Date('2026-03-03T00:00:00Z'),
      dataset,
    });
    const r2 = await sut.execute({
      tenantId: TENANT_ID,
      generatedBy: USER_ID,
      startDate: new Date('2026-03-01T00:00:00Z'),
      endDate: new Date('2026-03-03T00:00:00Z'),
      dataset,
    });
    // Mesmo dataset = mesmo conteúdo binário = mesmo SHA-256.
    expect(r1.contentHash).toBe(r2.contentHash);
    expect(r1.sizeBytes).toBe(r2.sizeBytes);
    // Mas storageKey DIFERE (artifactId UUID novo a cada execução — D-03 não
    // sobrescreve histórico).
    expect(r1.storageKey).not.toBe(r2.storageKey);
    expect(r1.artifactId).not.toBe(r2.artifactId);
  });
});
