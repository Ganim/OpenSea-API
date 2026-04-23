/**
 * generate-folha-espelho.spec.ts — Phase 06 / Plan 06-04 Task 2
 *
 * Testa o use case individual:
 *  - Happy path: 1 funcionário + competência válida → artifactId + downloadUrl
 *  - ComplianceArtifact criado com filters={employeeId}
 *  - Competência inválida ('abc' / '2026-13' / '') → BadRequestError
 *  - Funcionário de outro tenant → ResourceNotFoundError
 *  - PDF gerado começa com %PDF-
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryAbsencesRepository } from '@/repositories/hr/in-memory/in-memory-absences-repository';
import { InMemoryComplianceArtifactRepository } from '@/repositories/hr/in-memory/in-memory-compliance-artifact-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryShiftAssignmentsRepository } from '@/repositories/hr/in-memory/in-memory-shift-assignments-repository';
import { InMemoryShiftsRepository } from '@/repositories/hr/in-memory/in-memory-shifts-repository';
import { InMemoryTimeBankRepository } from '@/repositories/hr/in-memory/in-memory-time-bank-repository';
import { InMemoryTimeEntriesRepository } from '@/repositories/hr/in-memory/in-memory-time-entries-repository';
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

import { GenerateFolhaEspelhoUseCase } from './generate-folha-espelho';
import { TimeBankConsolidationAdapter } from './time-bank-consolidation-adapter';

// ─── Fake FileUploadService (mirror de generate-afd.spec) ────────────────────
class FakeFileUploadService implements FileUploadService {
  public uploads: Array<{
    key: string;
    body: Buffer;
    options: UploadWithKeyOptions;
  }> = [];

  async upload(): Promise<UploadResult> {
    throw new Error('upload() não usado aqui');
  }

  async uploadWithKey(
    body: Buffer,
    key: string,
    options: UploadWithKeyOptions,
  ): Promise<UploadWithKeyResult> {
    this.uploads.push({ key, body, options });
    return { key, bucket: 'fake-bucket', etag: '"et"', size: body.length };
  }

  async getPresignedUrl(key: string, ttl?: number): Promise<string> {
    return `https://fake-r2.test/${key}?ttl=${ttl ?? 3600}`;
  }

  async getObject(): Promise<Buffer> {
    throw new Error('not used');
  }

  async delete(): Promise<void> {
    // no-op
  }

  async initiateMultipartUpload(
    _fileName: string,
    _mimeType: string,
    _options: UploadOptions,
  ): Promise<MultipartUploadInit> {
    throw new Error('not used');
  }

  async getPresignedPartUrls(
    _key: string,
    _uploadId: string,
    _totalParts: number,
  ): Promise<MultipartPartUrl[]> {
    throw new Error('not used');
  }

  async completeMultipartUpload(
    _key: string,
    _uploadId: string,
    _parts: MultipartCompletePart[],
  ): Promise<UploadResult> {
    throw new Error('not used');
  }

  async abortMultipartUpload(): Promise<void> {
    // no-op
  }
}

// ─── In-memory Overtime repo minimal ─────────────────────────────────────────
import type { OvertimeRepository } from '@/repositories/hr/overtime-repository';
import type { Overtime } from '@/entities/hr/overtime';
class InMemoryOvertimeRepo implements OvertimeRepository {
  public items: Overtime[] = [];
  async create(): Promise<Overtime> {
    throw new Error('not used');
  }
  async findById() {
    return null;
  }
  async findMany() {
    return [];
  }
  async findManyPaginated() {
    return { overtimes: [], total: 0 };
  }
  async findManyByEmployee() {
    return [];
  }
  async findManyByEmployeeAndDateRange() {
    return [];
  }
  async findManyPending() {
    return [];
  }
  async findManyApproved() {
    return [];
  }
  async update() {
    return null;
  }
  async save() {
    // no-op
  }
  async delete() {
    // no-op
  }
}

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_TENANT = '99999999-9999-9999-9999-999999999999';
const USER_ID = '22222222-2222-2222-2222-222222222222';
const VALID_CPF = '11144477735'; // CPF com dígitos verificadores válidos

let employees: InMemoryEmployeesRepository;
let timeEntries: InMemoryTimeEntriesRepository;
let overtimes: InMemoryOvertimeRepo;
let absences: InMemoryAbsencesRepository;
let shiftAssignments: InMemoryShiftAssignmentsRepository;
let shifts: InMemoryShiftsRepository;
let timeBank: InMemoryTimeBankRepository;
let complianceRepo: InMemoryComplianceArtifactRepository;
let fileUpload: FakeFileUploadService;
let adapter: TimeBankConsolidationAdapter;
let sut: GenerateFolhaEspelhoUseCase;

beforeEach(async () => {
  employees = new InMemoryEmployeesRepository();
  timeEntries = new InMemoryTimeEntriesRepository();
  overtimes = new InMemoryOvertimeRepo();
  absences = new InMemoryAbsencesRepository();
  shiftAssignments = new InMemoryShiftAssignmentsRepository();
  shifts = new InMemoryShiftsRepository();
  timeBank = new InMemoryTimeBankRepository();
  complianceRepo = new InMemoryComplianceArtifactRepository();
  fileUpload = new FakeFileUploadService();

  adapter = new TimeBankConsolidationAdapter(
    timeEntries,
    overtimes,
    absences,
    shiftAssignments,
    shifts,
    timeBank,
    employees,
  );
  sut = new GenerateFolhaEspelhoUseCase(
    employees,
    adapter,
    complianceRepo,
    fileUpload,
  );
});

async function seedEmployee(tenantId = TENANT_ID): Promise<string> {
  const emp = await employees.create({
    tenantId,
    registrationNumber: '000123',
    fullName: 'João da Silva',
    cpf: CPF.create(VALID_CPF),
    country: 'BR',
    hireDate: new Date('2022-01-15'),
    status: EmployeeStatus.ACTIVE(),
    contractType: ContractType.CLT(),
    workRegime: WorkRegime.FULL_TIME(),
    weeklyHours: 40,
  });
  return emp.id.toString();
}

const TENANT_CONTEXT = {
  razaoSocial: 'EMPRESA DEMO LTDA',
  cnpj: '12345678000190',
  endereco: 'Rua das Flores, 100',
};

describe('GenerateFolhaEspelhoUseCase — happy path', () => {
  it('gera artefato FOLHA_ESPELHO e cria ComplianceArtifact com filters.employeeId', async () => {
    const employeeId = await seedEmployee();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      generatedBy: USER_ID,
      employeeId,
      competencia: '2026-03',
      tenantContext: TENANT_CONTEXT,
    });

    expect(result.artifactId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(result.contentHash).toHaveLength(64);
    expect(result.sizeBytes).toBeGreaterThan(3000);
    expect(result.storageKey).toMatch(
      new RegExp(
        `^${TENANT_ID}/compliance/folha-espelho/2026/03/[0-9a-f-]+\\.pdf$`,
      ),
    );
    expect(result.downloadUrl).toContain(result.storageKey);

    // Upload chamado com PDF mime + key determinística
    expect(fileUpload.uploads).toHaveLength(1);
    expect(fileUpload.uploads[0].key).toBe(result.storageKey);
    expect(fileUpload.uploads[0].options.mimeType).toBe('application/pdf');
    expect(fileUpload.uploads[0].options.metadata).toMatchObject({
      'x-tenant-id': TENANT_ID,
      'x-artifact-kind': 'FOLHA_ESPELHO',
      'x-competencia': '2026-03',
      'x-employee-id': employeeId,
    });

    // Buffer começa com %PDF-
    expect(fileUpload.uploads[0].body.subarray(0, 5).toString('latin1')).toBe(
      '%PDF-',
    );

    // ComplianceArtifact persistido
    expect(complianceRepo.items).toHaveLength(1);
    const artifact = complianceRepo.items[0];
    expect(artifact.type).toBe('FOLHA_ESPELHO');
    expect(artifact.competencia).toBe('2026-03');
    expect(artifact.filters).toEqual({ employeeId });
    expect(artifact.contentHash).toBe(result.contentHash);
  });

  it('executa em < 5s em tenant típico (smoke de performance)', async () => {
    const employeeId = await seedEmployee();

    const t0 = Date.now();
    await sut.execute({
      tenantId: TENANT_ID,
      generatedBy: USER_ID,
      employeeId,
      competencia: '2026-03',
      tenantContext: TENANT_CONTEXT,
    });
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(5000);
  });
});

describe('GenerateFolhaEspelhoUseCase — validação', () => {
  it('rejeita competência vazia com BadRequestError', async () => {
    const employeeId = await seedEmployee();
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        generatedBy: USER_ID,
        employeeId,
        competencia: '',
        tenantContext: TENANT_CONTEXT,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejeita competência "abc" com BadRequestError', async () => {
    const employeeId = await seedEmployee();
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        generatedBy: USER_ID,
        employeeId,
        competencia: 'abc',
        tenantContext: TENANT_CONTEXT,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('rejeita competência com formato MM-YYYY (invertido)', async () => {
    const employeeId = await seedEmployee();
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        generatedBy: USER_ID,
        employeeId,
        competencia: '03-2026',
        tenantContext: TENANT_CONTEXT,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});

describe('GenerateFolhaEspelhoUseCase — multi-tenant isolation (T-06-04-01)', () => {
  it('rejeita com ResourceNotFoundError quando employeeId pertence a outro tenant', async () => {
    const employeeIdOtherTenant = await seedEmployee(OTHER_TENANT);

    await expect(
      sut.execute({
        tenantId: TENANT_ID, // tenta gerar no tenant errado
        generatedBy: USER_ID,
        employeeId: employeeIdOtherTenant,
        competencia: '2026-03',
        tenantContext: TENANT_CONTEXT,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('rejeita com ResourceNotFoundError quando employeeId nem existe', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        generatedBy: USER_ID,
        employeeId: 'ghost-employee-id',
        competencia: '2026-03',
        tenantContext: TENANT_CONTEXT,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});

describe('GenerateFolhaEspelhoUseCase — storage key determinística', () => {
  it('usa competência para YYYY/MM no path (não generatedAt)', async () => {
    const employeeId = await seedEmployee();
    const result = await sut.execute({
      tenantId: TENANT_ID,
      generatedBy: USER_ID,
      employeeId,
      competencia: '2026-07',
      tenantContext: TENANT_CONTEXT,
    });
    expect(result.storageKey).toContain('/compliance/folha-espelho/2026/07/');
  });
});
