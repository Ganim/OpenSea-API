import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  PIS,
  TimeEntryType,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryPunchApprovalsRepository } from '@/repositories/hr/in-memory/in-memory-punch-approvals-repository';
import { InMemoryTimeEntriesRepository } from '@/repositories/hr/in-memory/in-memory-time-entries-repository';

import { CreateSelfPunchApprovalUseCase } from './create-self-punch-approval';

let approvalsRepo: InMemoryPunchApprovalsRepository;
let employeesRepo: InMemoryEmployeesRepository;
let timeEntriesRepo: InMemoryTimeEntriesRepository;
let sut: CreateSelfPunchApprovalUseCase;
let tenantId: string;
let userId: string;
let employeeId: string;

/** Gera um PIS válido para satisfazer a check-digit `PIS.isValid`. */
function generateValidPIS(): string {
  const digits = Array.from({ length: 10 }, () =>
    Math.floor(Math.random() * 10),
  );
  // Evita PIS com todos os dígitos iguais (rejected pelo isValid).
  if (digits.every((d) => d === digits[0])) digits[0] = (digits[0] + 1) % 10;
  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += digits[i] * weights[i];
  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? 0 : 11 - remainder;
  return `${digits.join('')}${checkDigit}`;
}

function seedEmployee(opts: { tenantId: string; userId: string }): string {
  const employee = Employee.create({
    tenantId: new UniqueEntityID(opts.tenantId),
    userId: new UniqueEntityID(opts.userId),
    registrationNumber: `EMP-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 6)}`,
    fullName: 'João Silva',
    cpf: CPF.create('11144477735'),
    pis: PIS.create(generateValidPIS()),
    country: 'Brasil',
    hireDate: new Date('2024-01-01'),
    status: EmployeeStatus.create('ACTIVE'),
    contractType: ContractType.create('CLT'),
    workRegime: WorkRegime.create('FULL_TIME'),
    weeklyHours: 44,
  });
  employeesRepo.items.push(employee);
  return employee.id.toString();
}

describe('CreateSelfPunchApprovalUseCase', () => {
  beforeEach(() => {
    approvalsRepo = new InMemoryPunchApprovalsRepository();
    employeesRepo = new InMemoryEmployeesRepository();
    timeEntriesRepo = new InMemoryTimeEntriesRepository();
    tenantId = new UniqueEntityID().toString();
    userId = new UniqueEntityID().toString();
    employeeId = seedEmployee({ tenantId, userId });
    sut = new CreateSelfPunchApprovalUseCase(
      approvalsRepo,
      employeesRepo,
      timeEntriesRepo,
    );
  });

  it('happy path — funcionário cria PunchApproval PENDING via proposedTimestamp + entryType', async () => {
    const result = await sut.execute({
      tenantId,
      userId,
      proposedTimestamp: '2026-04-24T09:00:00Z',
      entryType: 'CLOCK_IN',
      reason: 'EMPLOYEE_SELF_REQUEST',
      note: 'Esqueci de bater entrada',
    });

    expect(result.status).toBe('PENDING');
    expect(result.approvalId).toBeDefined();
    expect(approvalsRepo.items).toHaveLength(1);
    const stored = approvalsRepo.items[0];
    expect(stored.employeeId.toString()).toBe(employeeId);
    expect(stored.reason).toBe('EMPLOYEE_SELF_REQUEST');
    expect(stored.details).toMatchObject({
      origin: 'EMPLOYEE_SELF_REQUEST',
      proposedTimestamp: '2026-04-24T09:00:00Z',
      proposedEntryType: 'CLOCK_IN',
    });
  });

  it('user SEM Employee linkado → ResourceNotFoundError', async () => {
    const orphanUserId = new UniqueEntityID().toString();
    await expect(
      sut.execute({
        tenantId,
        userId: orphanUserId,
        proposedTimestamp: '2026-04-24T09:00:00Z',
        entryType: 'CLOCK_IN',
        reason: 'EMPLOYEE_SELF_REQUEST',
      }),
    ).rejects.toThrow(/Employee record not found/i);
  });

  it('timeEntryId pertencente a OUTRO employee → BadRequestError ownership', async () => {
    const otherEmployeeId = new UniqueEntityID();
    const entry = await timeEntriesRepo.create({
      tenantId,
      employeeId: otherEmployeeId,
      entryType: TimeEntryType.create('CLOCK_IN'),
      timestamp: new Date(),
    });

    await expect(
      sut.execute({
        tenantId,
        userId,
        timeEntryId: entry.id.toString(),
        reason: 'OUT_OF_GEOFENCE',
      }),
    ).rejects.toThrow(/does not belong to you/i);
  });

  it('timeEntryId do PRÓPRIO employee → cria aprovação com sucesso', async () => {
    const entry = await timeEntriesRepo.create({
      tenantId,
      employeeId: new UniqueEntityID(employeeId),
      entryType: TimeEntryType.create('CLOCK_IN'),
      timestamp: new Date(),
    });

    const result = await sut.execute({
      tenantId,
      userId,
      timeEntryId: entry.id.toString(),
      reason: 'OUT_OF_GEOFENCE',
      note: 'Estava na zona vizinha',
    });

    expect(result.status).toBe('PENDING');
    expect(approvalsRepo.items[0].timeEntryId?.toString()).toBe(
      entry.id.toString(),
    );
  });

  it('rate-limit anti-spam: 5+ PENDING → BadRequestError "Too many pending"', async () => {
    // Pre-seed 5 PENDING para o mesmo employee.
    for (let i = 0; i < 5; i++) {
      await sut.execute({
        tenantId,
        userId,
        proposedTimestamp: `2026-04-2${i + 1}T09:00:00Z`,
        entryType: 'CLOCK_IN',
        reason: 'EMPLOYEE_SELF_REQUEST',
      });
    }

    await expect(
      sut.execute({
        tenantId,
        userId,
        proposedTimestamp: '2026-04-26T09:00:00Z',
        entryType: 'CLOCK_IN',
        reason: 'EMPLOYEE_SELF_REQUEST',
      }),
    ).rejects.toThrow(/Too many pending/i);
  });

  it('body sem timeEntryId E sem (proposedTimestamp + entryType) → BadRequestError', async () => {
    await expect(
      sut.execute({
        tenantId,
        userId,
        reason: 'EMPLOYEE_SELF_REQUEST',
      }),
    ).rejects.toThrow(/timeEntryId OR/i);
  });

  it('use case sem fileUploadService passa happy path quando evidenceFileKeys ausente', async () => {
    const sutSemFileUpload = new CreateSelfPunchApprovalUseCase(
      approvalsRepo,
      employeesRepo,
      timeEntriesRepo,
      // SEM fileUploadService.
    );

    const result = await sutSemFileUpload.execute({
      tenantId,
      userId,
      proposedTimestamp: '2026-04-24T09:00:00Z',
      entryType: 'CLOCK_IN',
      reason: 'EMPLOYEE_SELF_REQUEST',
    });
    expect(result.status).toBe('PENDING');
  });

  it('use case com fileUploadService mock retornando null em headObject → throws EvidenceFileNotFoundError', async () => {
    const headObject = vi.fn().mockResolvedValue(null);
    const sutWithFileUpload = new CreateSelfPunchApprovalUseCase(
      approvalsRepo,
      employeesRepo,
      timeEntriesRepo,
      { headObject },
    );

    await expect(
      sutWithFileUpload.execute({
        tenantId,
        userId,
        proposedTimestamp: '2026-04-24T09:00:00Z',
        entryType: 'CLOCK_IN',
        reason: 'EMPLOYEE_SELF_REQUEST',
        evidenceFileKeys: ['phantom-key-not-uploaded'],
      }),
    ).rejects.toThrow(/Evidence file not found/i);
    expect(headObject).toHaveBeenCalledWith('phantom-key-not-uploaded');
  });

  it('evidenceFileKeys válidas → cada key vira EvidenceFile attached', async () => {
    const headObject = vi.fn().mockResolvedValue({
      contentLength: 1024,
      contentType: 'application/pdf',
    });
    const sutWithFileUpload = new CreateSelfPunchApprovalUseCase(
      approvalsRepo,
      employeesRepo,
      timeEntriesRepo,
      { headObject },
    );

    await sutWithFileUpload.execute({
      tenantId,
      userId,
      proposedTimestamp: '2026-04-24T09:00:00Z',
      entryType: 'CLOCK_IN',
      reason: 'EMPLOYEE_SELF_REQUEST',
      evidenceFileKeys: [
        'tenant/x/punch-approvals/abc/atestado.pdf',
        'tenant/x/punch-approvals/abc/foto.jpg',
      ],
    });

    expect(headObject).toHaveBeenCalledTimes(2);
    const stored = approvalsRepo.items[0];
    expect(stored.evidenceFiles).toHaveLength(2);
    expect(stored.evidenceFiles[0].storageKey).toBe(
      'tenant/x/punch-approvals/abc/atestado.pdf',
    );
    expect(stored.evidenceFiles[0].uploadedBy).toBe(userId);
  });
});
