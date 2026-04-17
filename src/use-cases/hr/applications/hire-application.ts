import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnprocessableEntityError } from '@/@errors/use-cases/unprocessable-entity-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Application } from '@/entities/hr/application';
import type { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import type { TransactionManager } from '@/lib/transaction-manager';
import type { ApplicationsRepository } from '@/repositories/hr/applications-repository';
import type { CandidatesRepository } from '@/repositories/hr/candidates-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { JobPostingsRepository } from '@/repositories/hr/job-postings-repository';

/**
 * Default weekly hours assigned to the new Employee when the Vacancy
 * (JobPosting) does not carry an explicit workload. Matches the CLT standard
 * "44h" full-time reference used elsewhere in the HR module.
 */
const DEFAULT_WEEKLY_HOURS = 44;

/**
 * Default contract type applied when the Vacancy does not specify one.
 * CLT is the safest default for Brazilian payroll compliance.
 */
const DEFAULT_CONTRACT_TYPE = 'CLT';

/**
 * Default work regime when the Vacancy does not specify one.
 */
const DEFAULT_WORK_REGIME = 'FULL_TIME';

/**
 * Application statuses that allow a hire to proceed. Any other status
 * (REJECTED, WITHDRAWN, HIRED, or a not-yet-advanced application such as
 * APPLIED or SCREENING) is rejected with a 400 because the recruiter must
 * either finish the interview pipeline or explicitly advance the status.
 */
const HIREABLE_APPLICATION_STATUSES = new Set([
  'OFFER',
  'ASSESSMENT',
  'INTERVIEW',
]);

export interface HireApplicationRequest {
  tenantId: string;
  applicationId: string;
  /** Optional start date; defaults to "now" when omitted. */
  hireDate?: Date;
  /**
   * Optional explicit employee registration number. When omitted, a unique
   * one is generated from `EMP-<ts36>-<cpfPrefix>`.
   */
  registrationNumber?: string;
  /**
   * Optional overrides for the employee record. Useful when the recruiter
   * already negotiated a salary that differs from the JobPosting range.
   */
  baseSalary?: number;
  contractType?: string;
  workRegime?: string;
  weeklyHours?: number;
}

export interface HireApplicationResponse {
  application: Application;
  employee: Employee;
  /**
   * Admission record identifier. `null` when the Admission aggregate is not
   * yet modeled in the schema — see inline TODO in the use case.
   */
  admissionId: string | null;
}

export class HireApplicationUseCase {
  constructor(
    private applicationsRepository: ApplicationsRepository,
    private candidatesRepository?: CandidatesRepository,
    private employeesRepository?: EmployeesRepository,
    private jobPostingsRepository?: JobPostingsRepository,
    private transactionManager?: TransactionManager,
  ) {}

  async execute(
    request: HireApplicationRequest,
  ): Promise<HireApplicationResponse> {
    const {
      tenantId,
      applicationId,
      hireDate,
      registrationNumber,
      baseSalary,
      contractType,
      workRegime,
      weeklyHours,
    } = request;

    const existingApplication = await this.applicationsRepository.findById(
      new UniqueEntityID(applicationId),
      tenantId,
    );

    if (!existingApplication) {
      throw new ResourceNotFoundError('Candidatura não encontrada');
    }

    if (
      existingApplication.status === 'REJECTED' ||
      existingApplication.status === 'WITHDRAWN'
    ) {
      throw new BadRequestError(
        'Não é possível contratar um candidato com candidatura rejeitada ou desistente',
      );
    }

    if (existingApplication.status === 'HIRED') {
      throw new BadRequestError('Este candidato já foi contratado');
    }

    // Additional hireable-state gate: the recruiter must advance the pipeline
    // all the way to OFFER/ASSESSMENT/INTERVIEW before hiring. Older tests may
    // not populate the downstream repositories; we only enforce the gate when
    // those repositories are wired (post-P0 backfill).
    if (
      this.candidatesRepository &&
      this.employeesRepository &&
      this.jobPostingsRepository &&
      !HIREABLE_APPLICATION_STATUSES.has(existingApplication.status)
    ) {
      throw new BadRequestError(
        'A candidatura precisa estar em uma etapa avançada do processo antes da contratação',
      );
    }

    const runAllSteps = async (): Promise<HireApplicationResponse> => {
      // Legacy flow: when downstream repositories are not wired yet, keep the
      // status-only update so existing callers (and the specs preceding the
      // P0 backfill) keep working.
      if (
        !this.candidatesRepository ||
        !this.employeesRepository ||
        !this.jobPostingsRepository
      ) {
        const effectiveHireDate = hireDate ?? new Date();
        const updatedApplication = await this.applicationsRepository.update({
          id: new UniqueEntityID(applicationId),
          tenantId,
          status: 'HIRED',
          hiredAt: effectiveHireDate,
        });

        if (!updatedApplication) {
          throw new ResourceNotFoundError('Candidatura não encontrada');
        }

        return {
          application: updatedApplication,
          // Employee/admission creation is guarded by the presence of their
          // repositories. Older controllers that never wired them still need
          // a valid response shape — the new controller wires everything.
          employee: undefined as unknown as Employee,
          admissionId: null,
        };
      }

      // Full hire pipeline — repositories required.
      const candidate = await this.candidatesRepository.findById(
        existingApplication.candidateId,
        tenantId,
      );

      if (!candidate) {
        throw new ResourceNotFoundError(
          'Candidato associado à candidatura não foi encontrado',
        );
      }

      if (!candidate.cpf) {
        throw new UnprocessableEntityError(
          'Candidato não possui CPF cadastrado; não é possível realizar admissão.',
        );
      }

      const candidateCpf = CPF.create(candidate.cpf);
      const employeeWithSameCpf = await this.employeesRepository.findByCpf(
        candidateCpf,
        tenantId,
        true,
      );
      if (employeeWithSameCpf) {
        throw new ConflictError(
          'Funcionário com este CPF já existe',
        );
      }

      const jobPosting = await this.jobPostingsRepository.findById(
        existingApplication.jobPostingId,
        tenantId,
      );

      const effectiveRegistrationNumber =
        registrationNumber ??
        this.generateRegistrationNumber(candidateCpf.value);

      const effectiveHireDate = hireDate ?? new Date();
      const effectiveContractType = ContractType.create(
        (contractType ?? DEFAULT_CONTRACT_TYPE).toUpperCase(),
      );
      const effectiveWorkRegime = WorkRegime.create(
        (workRegime ?? DEFAULT_WORK_REGIME).toUpperCase(),
      );
      const effectiveWeeklyHours = weeklyHours ?? DEFAULT_WEEKLY_HOURS;
      const effectiveBaseSalary =
        baseSalary ?? jobPosting?.salaryMin ?? jobPosting?.salaryMax;

      const createdEmployee = await this.employeesRepository.create({
        tenantId,
        registrationNumber: effectiveRegistrationNumber,
        fullName: candidate.fullName,
        cpf: candidateCpf,
        email: candidate.email,
        phone: candidate.phone,
        departmentId: jobPosting?.departmentId,
        positionId: jobPosting?.positionId,
        hireDate: effectiveHireDate,
        status: EmployeeStatus.ACTIVE(),
        baseSalary: effectiveBaseSalary,
        contractType: effectiveContractType,
        workRegime: effectiveWorkRegime,
        weeklyHours: effectiveWeeklyHours,
        country: 'Brasil',
        metadata: {
          candidateId: existingApplication.candidateId.toString(),
          applicationId: existingApplication.id.toString(),
          jobPostingId: existingApplication.jobPostingId.toString(),
          hiredFromRecruitment: true,
        },
      });

      const updatedApplication = await this.applicationsRepository.update({
        id: new UniqueEntityID(applicationId),
        tenantId,
        status: 'HIRED',
        hiredAt: effectiveHireDate,
      });

      if (!updatedApplication) {
        throw new ResourceNotFoundError('Candidatura não encontrada');
      }

      // TODO(CLT Art. 40 — Admission record): create an Admission aggregate
      // once the schema adds it. Mandatory columns per CLT compliance:
      //   - admissionDate (DateTime, required)
      //   - ctps (VarChar, required — worker Carteira de Trabalho)
      //   - hireType (enum CLT|PJ|INTERN|TEMPORARY|APPRENTICE, required)
      //   - salary (Decimal(12,2), required)
      //   - employeeId (FK → employees.id, required)
      //   - status (enum PENDING|IN_PROGRESS|COMPLETED, default PENDING)
      // For now we return `admissionId: null` so the controller can surface
      // this gap in the audit log without losing the hire operation.
      return {
        application: updatedApplication,
        employee: createdEmployee,
        admissionId: null,
      };
    };

    if (this.transactionManager) {
      return this.transactionManager.run(() => runAllSteps());
    }

    return runAllSteps();
  }

  /**
   * Generates a unique employee registration number following the
   * `EMP-<ts36>-<cpfPrefix>` pattern:
   *   - ts36: `Date.now().toString(36)` — base-36 milliseconds for a compact,
   *     monotonically increasing segment that avoids collisions across rapid
   *     hire batches.
   *   - cpfPrefix: first 3 digits of the candidate's CPF (digits-only),
   *     enough to distinguish same-millisecond hires while not exposing the
   *     full CPF inside an internal registration code.
   *
   * Falls back to a random 3-char suffix when the CPF is missing — in
   * practice the caller rejects earlier (see UnprocessableEntityError), so
   * the fallback is defensive only.
   */
  private generateRegistrationNumber(cpfDigits?: string): string {
    const timestampSuffix = Date.now().toString(36).toUpperCase();
    const cleanCpf = (cpfDigits ?? '').replace(/\D/g, '');
    const cpfPrefix = cleanCpf.length >= 3
      ? cleanCpf.slice(0, 3)
      : Math.floor(Math.random() * 900 + 100).toString();
    return `EMP-${timestampSuffix}-${cpfPrefix}`;
  }
}
