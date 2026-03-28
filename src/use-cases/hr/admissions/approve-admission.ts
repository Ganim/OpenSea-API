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

const DEFAULT_ADMISSION_ONBOARDING_ITEMS = [
  {
    title: 'Assinar contrato de trabalho',
    description: 'Leia e assine o contrato de trabalho junto ao departamento pessoal',
  },
  {
    title: 'Entregar documentos pessoais',
    description: 'Apresente os documentos originais para conferência (RG, CPF, CTPS, etc.)',
  },
  {
    title: 'Realizar exame admissional (ASO)',
    description: 'Agende e realize o exame médico admissional na clínica indicada',
  },
  {
    title: 'Receber crachá e credenciais de acesso',
    description: 'Retire seu crachá e credenciais de acesso às dependências da empresa',
  },
  {
    title: 'Configurar e-mail corporativo',
    description: 'Configure seu e-mail corporativo e demais ferramentas de comunicação',
  },
  {
    title: 'Receber equipamentos de trabalho',
    description: 'Retire e confira os equipamentos necessários para suas atividades',
  },
  {
    title: 'Participar da integração com a equipe',
    description: 'Conheça seus colegas de equipe e participe da dinâmica de boas-vindas',
  },
  {
    title: 'Conhecer as instalações da empresa',
    description: 'Faça o tour pelas instalações da empresa com o responsável designado',
  },
  {
    title: 'Ler e assinar o manual do colaborador',
    description: 'Leia o manual do colaborador e assine o termo de ciência',
  },
  {
    title: 'Configurar acesso aos sistemas internos',
    description: 'Solicite e configure os acessos aos sistemas e plataformas internas',
  },
  {
    title: 'Reunião com gestor direto',
    description: 'Agende uma reunião inicial com seu gestor para alinhamento de expectativas',
  },
  {
    title: 'Treinamento de segurança do trabalho',
    description: 'Participe do treinamento obrigatório de segurança do trabalho',
  },
];

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

    // Auto-generate eSocial S-2200 (Admission) event — non-blocking
    import('@/services/esocial/auto-generate').then(({ tryAutoGenerateEvent }) =>
      tryAutoGenerateEvent({
        tenantId,
        eventType: 'S-2200',
        referenceType: 'EMPLOYEE',
        referenceId: employee.id.toString(),
      }),
    );

    // Auto-create onboarding checklist for the new employee — non-blocking
    import(
      '@/use-cases/hr/onboarding/factories/make-create-onboarding-checklist-use-case'
    )
      .then(({ makeCreateOnboardingChecklistUseCase }) => {
        const createOnboardingChecklist =
          makeCreateOnboardingChecklistUseCase();
        return createOnboardingChecklist.execute({
          tenantId,
          employeeId: employee.id.toString(),
          title: `Onboarding — ${employee.fullName}`,
          items: DEFAULT_ADMISSION_ONBOARDING_ITEMS,
        });
      })
      .catch((onboardingError) => {
        console.error(
          '[ApproveAdmission] Failed to auto-create onboarding checklist:',
          onboardingError,
        );
      });

    return { invite: updatedInvite, employee };
  }
}
