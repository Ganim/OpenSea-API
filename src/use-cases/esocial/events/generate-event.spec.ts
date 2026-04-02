import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { EsocialEventsRepository } from '@/repositories/esocial/esocial-events-repository';
import type { EsocialConfigRepository } from '@/repositories/esocial/esocial-config-repository';
import type { EsocialRubricasRepository } from '@/repositories/esocial/esocial-rubricas-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { AbsencesRepository } from '@/repositories/hr/absences-repository';
import type { TerminationsRepository } from '@/repositories/hr/terminations-repository';
import type { DependantsRepository } from '@/repositories/hr/dependants-repository';
import type { MedicalExamsRepository } from '@/repositories/hr/medical-exams-repository';
import type { PayrollsRepository } from '@/repositories/hr/payrolls-repository';
import type { PayrollItemsRepository } from '@/repositories/hr/payroll-items-repository';
import { GenerateEventUseCase } from './generate-event';

describe('GenerateEventUseCase', () => {
  let sut: GenerateEventUseCase;
  let eventsRepository: EsocialEventsRepository;
  let configRepository: EsocialConfigRepository;
  let rubricasRepository: EsocialRubricasRepository;
  let employeesRepository: EmployeesRepository;
  let absencesRepository: AbsencesRepository;
  let terminationsRepository: TerminationsRepository;
  let dependantsRepository: DependantsRepository;
  let medicalExamsRepository: MedicalExamsRepository;
  let payrollsRepository: PayrollsRepository;
  let payrollItemsRepository: PayrollItemsRepository;

  beforeEach(() => {
    eventsRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    configRepository = {
      findByTenantId: vi.fn(),
      upsert: vi.fn(),
    };

    rubricasRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByCode: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    employeesRepository = { findById: vi.fn() } as unknown;
    absencesRepository = { findById: vi.fn() } as unknown;
    terminationsRepository = { findById: vi.fn() } as unknown;
    dependantsRepository = { findByEmployeeId: vi.fn() } as unknown;
    medicalExamsRepository = { findById: vi.fn() } as unknown;
    payrollsRepository = { findById: vi.fn() } as unknown;
    payrollItemsRepository = { findByPayrollId: vi.fn() } as unknown;

    sut = new GenerateEventUseCase(
      eventsRepository,
      configRepository,
      rubricasRepository,
      employeesRepository,
      absencesRepository,
      terminationsRepository,
      dependantsRepository,
      medicalExamsRepository,
      payrollsRepository,
      payrollItemsRepository,
    );
  });

  it('should throw BadRequestError for unsupported event type', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        eventType: 'INVALID-TYPE',
        referenceType: 'EMPLOYEE',
        referenceId: 'emp-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError if no eSocial config exists', async () => {
    vi.mocked(configRepository.findByTenantId).mockResolvedValue(null);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        eventType: 'S-2200',
        referenceType: 'EMPLOYEE',
        referenceId: 'emp-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError if nrInsc is not configured', async () => {
    vi.mocked(configRepository.findByTenantId).mockResolvedValue({
      environment: 'HOMOLOGACAO',
      tpInsc: 1,
      nrInsc: undefined,
    } as unknown);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        eventType: 'S-2200',
        referenceType: 'EMPLOYEE',
        referenceId: 'emp-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
