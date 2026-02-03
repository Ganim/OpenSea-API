import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  PIS,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { UserDTO } from '@/mappers/core/user/user-to-dto';
import type { UsersRepository } from '@/repositories/core/users-repository';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { CreateUserUseCase } from '@/use-cases/core/users/create-user';
import { AssignGroupToUserUseCase } from '@/use-cases/rbac/associations/assign-group-to-user';

export interface CreateEmployeeWithUserRequest {
  tenantId: string;
  // User data
  userEmail: string;
  userPassword: string;
  username?: string;
  permissionGroupId?: string;

  // Employee data
  registrationNumber: string;
  fullName: string;
  socialName?: string;
  birthDate?: Date;
  gender?: string;
  pcd?: boolean;
  maritalStatus?: string;
  nationality?: string;
  birthPlace?: string;
  emergencyContactInfo?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  healthConditions?: Array<{ description: string; requiresAttention: boolean }>;
  cpf: string;
  rg?: string;
  rgIssuer?: string;
  rgIssueDate?: Date;
  pis?: string;
  ctpsNumber?: string;
  ctpsSeries?: string;
  ctpsState?: string;
  voterTitle?: string;
  militaryDoc?: string;
  email?: string;
  personalEmail?: string;
  phone?: string;
  mobilePhone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  bankCode?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  bankAccountType?: string;
  pixKey?: string;
  departmentId?: string;
  positionId?: string;
  supervisorId?: string;
  companyId?: string;
  hireDate: Date;
  baseSalary: number;
  contractType: string;
  workRegime: string;
  weeklyHours: number;
  photoUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateEmployeeWithUserResponse {
  employee: Employee;
  user: UserDTO;
}

export class CreateEmployeeWithUserUseCase {
  constructor(
    private employeesRepository: EmployeesRepository,
    private createUserUseCase: CreateUserUseCase,
    private usersRepository: UsersRepository,
    private assignGroupToUserUseCase: AssignGroupToUserUseCase,
  ) {}

  async execute(
    request: CreateEmployeeWithUserRequest,
  ): Promise<CreateEmployeeWithUserResponse> {
    const {
      tenantId,
      // User data
      userEmail,
      userPassword,
      username,
      permissionGroupId,

      // Employee data
      registrationNumber,
      fullName,
      socialName,
      birthDate,
      gender,
      pcd = false,
      maritalStatus,
      nationality,
      birthPlace,
      emergencyContactInfo,
      healthConditions,
      cpf,
      rg,
      rgIssuer,
      rgIssueDate,
      pis,
      ctpsNumber,
      ctpsSeries,
      ctpsState,
      voterTitle,
      militaryDoc,
      email,
      personalEmail,
      phone,
      mobilePhone,
      emergencyContact,
      emergencyPhone,
      address,
      addressNumber,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      country = 'Brasil',
      bankCode,
      bankName,
      bankAgency,
      bankAccount,
      bankAccountType,
      pixKey,
      departmentId,
      positionId,
      supervisorId,
      companyId,
      hireDate,
      baseSalary,
      contractType,
      workRegime,
      weeklyHours,
      photoUrl,
      metadata = {},
    } = request;

    // Validate if CPF already exists
    const existingEmployeeByCpf = await this.employeesRepository.findByCpf(
      CPF.create(cpf),
      tenantId,
    );
    if (existingEmployeeByCpf) {
      throw new BadRequestError('Employee with this CPF already exists');
    }

    // Validate if registration number already exists
    const existingEmployeeByRegistration =
      await this.employeesRepository.findByRegistrationNumber(
        registrationNumber,
        tenantId,
      );
    if (existingEmployeeByRegistration) {
      throw new BadRequestError(
        'Employee with this registration number already exists',
      );
    }

    // Validate if PIS already exists (if provided)
    if (pis) {
      const existingEmployeeByPis = await this.employeesRepository.findByPis(
        PIS.create(pis),
        tenantId,
      );
      if (existingEmployeeByPis) {
        throw new BadRequestError('Employee with this PIS already exists');
      }
    }

    // Step 1: Create user account
    const { user } = await this.createUserUseCase.execute({
      email: userEmail,
      password: userPassword,
      username: username,
      profile: {
        name: fullName.split(' ')[0], // First name
        surname: fullName.split(' ').slice(1).join(' '), // Last name(s)
        avatarUrl: photoUrl,
        birthday: birthDate,
      },
    });

    // Step 1.5: Set forced password reset for new user
    await this.usersRepository.setForcePasswordReset(
      new UniqueEntityID(user.id),
      null, // System request (no admin user)
      'Conta criada - defina sua senha',
    );

    // Step 2: Create employee linked to user
    const pendingIssues = this.computePendingIssues({
      gender,
      birthDate,
      ctpsNumber,
      militaryDoc,
      positionId,
      companyId,
      phone,
      email,
      address,
      hireDate,
      baseSalary,
      emergencyContactInfo,
    });

    // Create value objects
    const cpfVO = CPF.create(cpf);
    const statusVO = EmployeeStatus.ACTIVE();
    const contractTypeVO = this.mapContractType(contractType);
    const workRegimeVO = this.mapWorkRegime(workRegime);
    const pisVO = pis ? PIS.create(pis) : undefined;

    // Create employee via repository
    const employee = await this.employeesRepository.create({
      tenantId,
      registrationNumber,
      userId: new UniqueEntityID(user.id),
      fullName,
      socialName,
      birthDate,
      gender,
      pcd,
      maritalStatus,
      nationality,
      birthPlace,
      emergencyContactInfo,
      healthConditions,
      cpf: cpfVO,
      rg,
      rgIssuer,
      rgIssueDate,
      pis: pisVO,
      ctpsNumber,
      ctpsSeries,
      ctpsState,
      voterTitle,
      militaryDoc,
      email,
      personalEmail,
      phone,
      mobilePhone,
      emergencyContact,
      emergencyPhone,
      address,
      addressNumber,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      country,
      bankCode,
      bankName,
      bankAgency,
      bankAccount,
      bankAccountType,
      pixKey,
      departmentId: departmentId ? new UniqueEntityID(departmentId) : undefined,
      positionId: positionId ? new UniqueEntityID(positionId) : undefined,
      supervisorId: supervisorId ? new UniqueEntityID(supervisorId) : undefined,
      companyId: companyId ? new UniqueEntityID(companyId) : undefined,
      hireDate,
      status: statusVO,
      baseSalary,
      contractType: contractTypeVO,
      workRegime: workRegimeVO,
      weeklyHours,
      photoUrl,
      metadata,
      pendingIssues,
    });

    // Step 3: Assign permission group to user (if provided)
    if (permissionGroupId) {
      try {
        await this.assignGroupToUserUseCase.execute({
          userId: user.id,
          groupId: permissionGroupId,
          expiresAt: null,
          grantedBy: null,
        });
      } catch (error) {
        // Log the error but don't fail the entire operation
        // The user has been created successfully, just the group assignment failed
        console.error(
          `Failed to assign permission group ${permissionGroupId} to user ${user.id}:`,
          error,
        );
        throw error;
      }
    }

    return {
      employee,
      user,
    };
  }

  private mapContractType(contractType: string) {
    switch (contractType.toUpperCase()) {
      case 'CLT':
        return ContractType.CLT();
      case 'PJ':
        return ContractType.PJ();
      case 'INTERN':
        return ContractType.INTERN();
      case 'TEMPORARY':
        return ContractType.TEMPORARY();
      case 'APPRENTICE':
        return ContractType.APPRENTICE();
      default:
        throw new BadRequestError(`Invalid contract type: ${contractType}`);
    }
  }

  private mapWorkRegime(workRegime: string) {
    switch (workRegime.toUpperCase()) {
      case 'FULL_TIME':
        return WorkRegime.FULL_TIME();
      case 'PART_TIME':
        return WorkRegime.PART_TIME();
      case 'HOURLY':
        return WorkRegime.HOURLY();
      case 'SHIFT':
        return WorkRegime.SHIFT();
      case 'FLEXIBLE':
        return WorkRegime.FLEXIBLE();
      default:
        throw new BadRequestError(`Invalid work regime: ${workRegime}`);
    }
  }

  private computePendingIssues(input: {
    gender?: string;
    birthDate?: Date;
    ctpsNumber?: string;
    militaryDoc?: string;
    positionId?: string;
    companyId?: string;
    phone?: string;
    email?: string;
    address?: string;
    hireDate?: Date;
    baseSalary?: number;
    emergencyContactInfo?: {
      name?: string;
      phone?: string;
      relationship?: string;
    };
  }): string[] {
    const pending: string[] = [];

    if (!input.gender) pending.push('gender');
    if (!input.birthDate) pending.push('birthDate');
    if (!input.ctpsNumber) pending.push('workCard');
    if (!input.positionId) pending.push('position');
    if (!input.companyId) pending.push('company');
    if (!input.phone) pending.push('phone');
    if (!input.email) pending.push('email');
    if (!input.address) pending.push('address');
    if (!input.hireDate) pending.push('admissionDate');
    if (!input.baseSalary) pending.push('salary');
    if (!input.emergencyContactInfo) pending.push('emergencyContact');
    if (!input.militaryDoc && input.gender?.toLowerCase() === 'masculino') {
      pending.push('reservistDocument');
    }

    return pending;
  }
}
