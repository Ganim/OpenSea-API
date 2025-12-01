import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  PIS,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface CreateEmployeeRequest {
  registrationNumber: string;
  userId?: string;
  fullName: string;
  socialName?: string;
  birthDate?: Date;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  birthPlace?: string;
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
  hireDate: Date;
  baseSalary: number;
  contractType: string;
  workRegime: string;
  weeklyHours: number;
  photoUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateEmployeeResponse {
  employee: Employee;
}

export class CreateEmployeeUseCase {
  constructor(private employeesRepository: EmployeesRepository) {}

  async execute(
    request: CreateEmployeeRequest,
  ): Promise<CreateEmployeeResponse> {
    const {
      registrationNumber,
      userId,
      fullName,
      socialName,
      birthDate,
      gender,
      maritalStatus,
      nationality,
      birthPlace,
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
    );
    if (existingEmployeeByCpf) {
      throw new Error('Employee with this CPF already exists');
    }

    // Validate if registration number already exists
    const existingEmployeeByRegistration =
      await this.employeesRepository.findByRegistrationNumber(
        registrationNumber,
      );
    if (existingEmployeeByRegistration) {
      throw new Error('Employee with this registration number already exists');
    }

    // Validate if user is already linked to another employee
    if (userId) {
      const existingEmployeeByUser =
        await this.employeesRepository.findByUserId(new UniqueEntityID(userId));
      if (existingEmployeeByUser) {
        throw new Error('User is already linked to another employee');
      }
    }

    // Validate if PIS already exists (if provided)
    if (pis) {
      const existingEmployeeByPis = await this.employeesRepository.findByPis(
        PIS.create(pis),
      );
      if (existingEmployeeByPis) {
        throw new Error('Employee with this PIS already exists');
      }
    }

    // Create value objects
    const cpfVO = CPF.create(cpf);
    const statusVO = EmployeeStatus.ACTIVE();
    const contractTypeVO = this.mapContractType(contractType);
    const workRegimeVO = this.mapWorkRegime(workRegime);
    const pisVO = pis ? PIS.create(pis) : undefined;

    // Create employee via repository
    const employee = await this.employeesRepository.create({
      registrationNumber,
      userId: userId ? new UniqueEntityID(userId) : undefined,
      fullName,
      socialName,
      birthDate,
      gender,
      maritalStatus,
      nationality,
      birthPlace,
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
      hireDate,
      status: statusVO,
      baseSalary,
      contractType: contractTypeVO,
      workRegime: workRegimeVO,
      weeklyHours,
      photoUrl,
      metadata,
    });

    return {
      employee,
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
        throw new Error(`Invalid contract type: ${contractType}`);
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
        throw new Error(`Invalid work regime: ${workRegime}`);
    }
  }
}
