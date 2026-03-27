import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  AdmissionInviteRecord,
  AdmissionsRepository,
} from '@/repositories/hr/admissions-repository';
import type { CreateEmployeeRequest } from '@/use-cases/hr/employees/create-employee';
import { CreateEmployeeUseCase } from '@/use-cases/hr/employees/create-employee';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { Employee } from '@/entities/hr/employee';

export interface ApproveAdmissionRequest {
  tenantId: string;
  inviteId: string;
  registrationNumber: string;
  weeklyHours?: number;
}

export interface ApproveAdmissionResponse {
  invite: AdmissionInviteRecord;
  employee: Employee;
}

export class ApproveAdmissionUseCase {
  private createEmployeeUseCase: CreateEmployeeUseCase;

  constructor(
    private admissionsRepository: AdmissionsRepository,
    employeesRepository: EmployeesRepository,
  ) {
    this.createEmployeeUseCase = new CreateEmployeeUseCase(employeesRepository);
  }

  async execute(
    request: ApproveAdmissionRequest,
  ): Promise<ApproveAdmissionResponse> {
    const {
      tenantId,
      inviteId,
      registrationNumber,
      weeklyHours = 44,
    } = request;

    const existingInvite = await this.admissionsRepository.findById(
      inviteId,
      tenantId,
    );

    if (!existingInvite) {
      throw new ResourceNotFoundError('Admission invite not found');
    }

    if (existingInvite.status === 'COMPLETED') {
      throw new BadRequestError('This admission is already completed');
    }

    if (existingInvite.status === 'CANCELLED') {
      throw new BadRequestError('Cannot approve a cancelled admission');
    }

    const candidateData =
      (existingInvite.candidateData as Record<string, unknown>) ?? {};

    const cpf = candidateData.cpf as string | undefined;
    if (!cpf) {
      throw new BadRequestError(
        'Candidate data must include CPF before approval',
      );
    }

    const createEmployeeRequest: CreateEmployeeRequest = {
      tenantId,
      registrationNumber,
      fullName: existingInvite.fullName,
      cpf,
      hireDate: existingInvite.expectedStartDate ?? new Date(),
      baseSalary: existingInvite.salary ?? undefined,
      contractType: existingInvite.contractType ?? 'CLT',
      workRegime: existingInvite.workRegime ?? 'FULL_TIME',
      weeklyHours,
      positionId: existingInvite.positionId ?? undefined,
      departmentId: existingInvite.departmentId ?? undefined,
      companyId: existingInvite.companyId ?? undefined,
      email:
        (candidateData.email as string) ?? existingInvite.email ?? undefined,
      phone:
        (candidateData.phone as string) ?? existingInvite.phone ?? undefined,
      personalEmail: candidateData.personalEmail as string | undefined,
      mobilePhone: candidateData.mobilePhone as string | undefined,
      birthDate: candidateData.birthDate
        ? new Date(candidateData.birthDate as string)
        : undefined,
      gender: candidateData.gender as string | undefined,
      maritalStatus: candidateData.maritalStatus as string | undefined,
      nationality: candidateData.nationality as string | undefined,
      rg: candidateData.rg as string | undefined,
      rgIssuer: candidateData.rgIssuer as string | undefined,
      pis: candidateData.pis as string | undefined,
      ctpsNumber: candidateData.ctpsNumber as string | undefined,
      ctpsSeries: candidateData.ctpsSeries as string | undefined,
      ctpsState: candidateData.ctpsState as string | undefined,
      address: candidateData.address as string | undefined,
      addressNumber: candidateData.addressNumber as string | undefined,
      complement: candidateData.complement as string | undefined,
      neighborhood: candidateData.neighborhood as string | undefined,
      city: candidateData.city as string | undefined,
      state: candidateData.state as string | undefined,
      zipCode: candidateData.zipCode as string | undefined,
      country: (candidateData.country as string) ?? 'Brasil',
      bankCode: candidateData.bankCode as string | undefined,
      bankName: candidateData.bankName as string | undefined,
      bankAgency: candidateData.bankAgency as string | undefined,
      bankAccount: candidateData.bankAccount as string | undefined,
      bankAccountType: candidateData.bankAccountType as string | undefined,
      pixKey: candidateData.pixKey as string | undefined,
    };

    const { employee } = await this.createEmployeeUseCase.execute(
      createEmployeeRequest,
    );

    const updatedInvite = await this.admissionsRepository.update({
      id: inviteId,
      status: 'COMPLETED',
      completedAt: new Date(),
      employeeId: employee.id.toString(),
    });

    if (!updatedInvite) {
      throw new ResourceNotFoundError('Failed to update admission status');
    }

    return { invite: updatedInvite, employee };
  }
}
