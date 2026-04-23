import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock @env (unit project não carrega .env).
vi.mock('@/@env', () => ({
  env: { NODE_ENV: 'test', RECEIPT_HMAC_KEY: undefined },
}));

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ComplianceVerifyLog } from '@/entities/hr/compliance-public-verify-log';
import type { ComplianceVerifyLogRepository } from '@/repositories/hr/compliance-public-verify-log-repository';
import type {
  TimeEntriesRepository,
  TimeEntryForReceiptLookup,
} from '@/repositories/hr/time-entries-repository';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

import {
  FindTimeEntryByReceiptHashUseCase,
  type TenantCnpjResolver,
} from './find-time-entry-by-receipt-hash';

// ─── Mocks mínimos ──────────────────────────────────────────────────────────

function makeFakeTimeEntryRepo(entry: TimeEntryForReceiptLookup | null = null) {
  const repo: Partial<TimeEntriesRepository> = {
    findByReceiptVerifyHash: vi.fn().mockResolvedValue(entry),
  };
  return repo as TimeEntriesRepository;
}

function makeFakeEmployeeRepo(employee: unknown) {
  return {
    findById: vi.fn().mockResolvedValue(employee),
  } as unknown as EmployeesRepository;
}

function makeFakeTenantRepo(tenant: unknown) {
  return {
    findById: vi.fn().mockResolvedValue(tenant),
  } as unknown as TenantsRepository;
}

function makeFakeVerifyLogRepo() {
  const creates: ComplianceVerifyLog[] = [];
  const repo: ComplianceVerifyLogRepository = {
    async create(log) {
      creates.push(log);
    },
    async countByNsrHashSince() {
      return 0;
    },
  };
  return { repo, creates };
}

function makeFakeCnpjResolver(cnpj: string): TenantCnpjResolver {
  return { resolve: vi.fn().mockResolvedValue(cnpj) };
}

const HASH = 'a'.repeat(64);

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('FindTimeEntryByReceiptHashUseCase', () => {
  let timeEntryRepo: TimeEntriesRepository;
  let employeeRepo: EmployeesRepository;
  let tenantRepo: TenantsRepository;
  let verifyLog: ReturnType<typeof makeFakeVerifyLogRepo>;
  let cnpjResolver: TenantCnpjResolver;

  beforeEach(() => {
    verifyLog = makeFakeVerifyLogRepo();
    cnpjResolver = makeFakeCnpjResolver('12345678000190');
  });

  it('retorna null e loga NOT_FOUND quando hash não bate', async () => {
    timeEntryRepo = makeFakeTimeEntryRepo(null);
    employeeRepo = makeFakeEmployeeRepo(null);
    tenantRepo = makeFakeTenantRepo(null);

    const useCase = new FindTimeEntryByReceiptHashUseCase(
      timeEntryRepo,
      employeeRepo,
      tenantRepo,
      verifyLog.repo,
      cnpjResolver,
    );

    const result = await useCase.execute({
      nsrHash: HASH,
      accessedFromIp: '203.0.113.7',
      accessedByUserAgent: 'Mozilla/5.0',
    });

    expect(result).toBeNull();
    expect(verifyLog.creates).toHaveLength(1);
    expect(verifyLog.creates[0].hitResult).toBe('NOT_FOUND');
    expect(verifyLog.creates[0].tenantId).toBeUndefined();
    expect(verifyLog.creates[0].ipAddress).toBe('203.0.113.7');
  });

  it('happy path: retorna DTO whitelist e loga FOUND com tenantId', async () => {
    const timeEntry: TimeEntryForReceiptLookup = {
      id: 'te-1',
      tenantId: 'tenant-abc',
      employeeId: 'emp-1',
      entryType: 'CLOCK_IN',
      timestamp: new Date('2026-03-15T11:02:00Z'),
      nsrNumber: 1234,
      approvalStatus: null,
    };
    timeEntryRepo = makeFakeTimeEntryRepo(timeEntry);
    employeeRepo = makeFakeEmployeeRepo({
      id: new UniqueEntityID('emp-1'),
      socialName: null,
      fullName: 'JOÃO DA SILVA',
      // Campos proibidos presentes para provar que o DTO não os inclui:
      cpf: { value: '12345678900' },
      registrationNumber: '99',
      email: 'joao@demo.com',
    });
    tenantRepo = makeFakeTenantRepo({
      id: new UniqueEntityID('tenant-abc'),
      name: 'Empresa Demo LTDA',
    });

    const useCase = new FindTimeEntryByReceiptHashUseCase(
      timeEntryRepo,
      employeeRepo,
      tenantRepo,
      verifyLog.repo,
      cnpjResolver,
    );

    const dto = await useCase.execute({
      nsrHash: HASH,
      accessedFromIp: '203.0.113.7',
      accessedByUserAgent: 'Mozilla/5.0',
    });

    expect(dto).not.toBeNull();
    expect(dto!.employeeName).toBe('JOÃO DA SILVA');
    expect(dto!.tenantRazaoSocial).toBe('Empresa Demo LTDA');
    expect(dto!.tenantCnpjMasked).toMatch(
      /^\*\*\.\*\*\*\.\*\*\*\/\d{4}-\d{2}$/,
    );
    expect(dto!.tenantCnpjMasked).toBe('**.***.***/0001-90');
    expect(dto!.nsrNumber).toBe(1234);
    expect(dto!.entryType).toBe('CLOCK_IN');
    expect(dto!.entryTypeLabel).toBe('Entrada');
    expect(dto!.status).toBe('APPROVED');

    // SENTINELA LGPD — nenhum campo proibido deve aparecer no DTO
    const json = JSON.stringify(dto);
    expect(json).not.toContain('12345678900'); // CPF raw
    expect(json).not.toContain('joao@demo.com'); // email
    expect(json).not.toContain('registrationNumber');
    expect(json).not.toContain('"99"'); // registration value
    expect(json).not.toContain('"cpf"');
    expect(json).not.toContain('"email"');
    expect(json).not.toContain('employeeId');
    expect(json).not.toContain('tenantId');

    // Verify log FOUND
    expect(verifyLog.creates).toHaveLength(1);
    expect(verifyLog.creates[0].hitResult).toBe('FOUND');
    expect(verifyLog.creates[0].tenantId?.toString()).toBe('tenant-abc');
    expect(verifyLog.creates[0].timeEntryId?.toString()).toBe('te-1');
  });

  it('mapeia approvalStatus PENDING → status PENDING_APPROVAL', async () => {
    const timeEntry: TimeEntryForReceiptLookup = {
      id: 'te-2',
      tenantId: 'tenant-abc',
      employeeId: 'emp-2',
      entryType: 'BREAK_START',
      timestamp: new Date('2026-03-15T12:00:00Z'),
      nsrNumber: 2000,
      approvalStatus: 'PENDING',
    };
    timeEntryRepo = makeFakeTimeEntryRepo(timeEntry);
    employeeRepo = makeFakeEmployeeRepo({
      id: new UniqueEntityID('emp-2'),
      socialName: 'Mari',
      fullName: 'Maria da Silva',
    });
    tenantRepo = makeFakeTenantRepo({
      id: new UniqueEntityID('tenant-abc'),
      name: 'Empresa Demo LTDA',
    });

    const useCase = new FindTimeEntryByReceiptHashUseCase(
      timeEntryRepo,
      employeeRepo,
      tenantRepo,
      verifyLog.repo,
      cnpjResolver,
    );

    const dto = await useCase.execute({
      nsrHash: HASH,
      accessedFromIp: null,
      accessedByUserAgent: null,
    });

    expect(dto!.status).toBe('PENDING_APPROVAL');
    expect(dto!.employeeName).toBe('Mari'); // socialName preferido
    expect(dto!.entryTypeLabel).toBe('Início do intervalo');
  });

  it('rejeita Zod quando nsrHash não bate regex', async () => {
    timeEntryRepo = makeFakeTimeEntryRepo(null);
    employeeRepo = makeFakeEmployeeRepo(null);
    tenantRepo = makeFakeTenantRepo(null);

    const useCase = new FindTimeEntryByReceiptHashUseCase(
      timeEntryRepo,
      employeeRepo,
      tenantRepo,
      verifyLog.repo,
      cnpjResolver,
    );

    await expect(
      useCase.execute({
        nsrHash: 'not-a-hex-hash',
        accessedFromIp: null,
        accessedByUserAgent: null,
      }),
    ).rejects.toThrow(); // ZodError
  });
});
