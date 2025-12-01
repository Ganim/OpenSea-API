import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  PIS,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface UpdateEmployeeRequest {
  employeeId: string;
  registrationNumber?: string;
  userId?: string | null;
  fullName?: string;
  socialName?: string | null;
  birthDate?: Date | null;
  gender?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  birthPlace?: string | null;
  cpf?: string;
  rg?: string | null;
  rgIssuer?: string | null;
  rgIssueDate?: Date | null;
  pis?: string | null;
  ctpsNumber?: string | null;
  ctpsSeries?: string | null;
  ctpsState?: string | null;
  voterTitle?: string | null;
  militaryDoc?: string | null;
  email?: string | null;
  personalEmail?: string | null;
  phone?: string | null;
  mobilePhone?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string;
  bankCode?: string | null;
  bankName?: string | null;
  bankAgency?: string | null;
  bankAccount?: string | null;
  bankAccountType?: string | null;
  pixKey?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  supervisorId?: string | null;
  hireDate?: Date;
  baseSalary?: number;
  contractType?: string;
  workRegime?: string;
  weeklyHours?: number;
  photoUrl?: string | null;
  metadata?: Record<string, unknown>;
}

export interface UpdateEmployeeResponse {
  employee: Employee;
}

export class UpdateEmployeeUseCase {
  constructor(private employeesRepository: EmployeesRepository) {}

  async execute(
    request: UpdateEmployeeRequest,
  ): Promise<UpdateEmployeeResponse> {
    const { employeeId, ...updateData } = request;

    // Find existing employee
    const existingEmployee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
    );

    if (!existingEmployee) {
      throw new ResourceNotFoundError('Employee');
    }

    // Validate CPF uniqueness if being updated
    if (updateData.cpf) {
      const cpfVO = CPF.create(updateData.cpf);
      const employeeWithCpf = await this.employeesRepository.findByCpf(cpfVO);
      if (employeeWithCpf && !employeeWithCpf.id.equals(existingEmployee.id)) {
        throw new Error('Employee with this CPF already exists');
      }
    }

    // Validate registration number uniqueness if being updated
    if (updateData.registrationNumber) {
      const employeeWithRegistration =
        await this.employeesRepository.findByRegistrationNumber(
          updateData.registrationNumber,
        );
      if (
        employeeWithRegistration &&
        !employeeWithRegistration.id.equals(existingEmployee.id)
      ) {
        throw new Error(
          'Employee with this registration number already exists',
        );
      }
    }

    // Validate user uniqueness if being updated
    if (updateData.userId) {
      const employeeWithUser = await this.employeesRepository.findByUserId(
        new UniqueEntityID(updateData.userId),
      );
      if (
        employeeWithUser &&
        !employeeWithUser.id.equals(existingEmployee.id)
      ) {
        throw new Error('User is already linked to another employee');
      }
    }

    // Validate PIS uniqueness if being updated
    if (updateData.pis) {
      const pisVO = PIS.create(updateData.pis);
      const employeeWithPis = await this.employeesRepository.findByPis(pisVO);
      if (employeeWithPis && !employeeWithPis.id.equals(existingEmployee.id)) {
        throw new Error('Employee with this PIS already exists');
      }
    }

    // Build update schema
    const updateSchema: Parameters<typeof this.employeesRepository.update>[0] =
      {
        id: new UniqueEntityID(employeeId),
      };

    if (updateData.registrationNumber !== undefined) {
      updateSchema.registrationNumber = updateData.registrationNumber;
    }

    if (updateData.userId !== undefined) {
      updateSchema.userId = updateData.userId
        ? new UniqueEntityID(updateData.userId)
        : null;
    }

    if (updateData.fullName !== undefined) {
      updateSchema.fullName = updateData.fullName;
    }

    if (updateData.socialName !== undefined) {
      updateSchema.socialName = updateData.socialName;
    }

    if (updateData.birthDate !== undefined) {
      updateSchema.birthDate = updateData.birthDate;
    }

    if (updateData.gender !== undefined) {
      updateSchema.gender = updateData.gender;
    }

    if (updateData.maritalStatus !== undefined) {
      updateSchema.maritalStatus = updateData.maritalStatus;
    }

    if (updateData.nationality !== undefined) {
      updateSchema.nationality = updateData.nationality;
    }

    if (updateData.birthPlace !== undefined) {
      updateSchema.birthPlace = updateData.birthPlace;
    }

    if (updateData.cpf !== undefined) {
      updateSchema.cpf = CPF.create(updateData.cpf);
    }

    if (updateData.rg !== undefined) {
      updateSchema.rg = updateData.rg;
    }

    if (updateData.rgIssuer !== undefined) {
      updateSchema.rgIssuer = updateData.rgIssuer;
    }

    if (updateData.rgIssueDate !== undefined) {
      updateSchema.rgIssueDate = updateData.rgIssueDate;
    }

    if (updateData.pis !== undefined) {
      updateSchema.pis = updateData.pis ? PIS.create(updateData.pis) : null;
    }

    if (updateData.ctpsNumber !== undefined) {
      updateSchema.ctpsNumber = updateData.ctpsNumber;
    }

    if (updateData.ctpsSeries !== undefined) {
      updateSchema.ctpsSeries = updateData.ctpsSeries;
    }

    if (updateData.ctpsState !== undefined) {
      updateSchema.ctpsState = updateData.ctpsState;
    }

    if (updateData.voterTitle !== undefined) {
      updateSchema.voterTitle = updateData.voterTitle;
    }

    if (updateData.militaryDoc !== undefined) {
      updateSchema.militaryDoc = updateData.militaryDoc;
    }

    if (updateData.email !== undefined) {
      updateSchema.email = updateData.email;
    }

    if (updateData.personalEmail !== undefined) {
      updateSchema.personalEmail = updateData.personalEmail;
    }

    if (updateData.phone !== undefined) {
      updateSchema.phone = updateData.phone;
    }

    if (updateData.mobilePhone !== undefined) {
      updateSchema.mobilePhone = updateData.mobilePhone;
    }

    if (updateData.emergencyContact !== undefined) {
      updateSchema.emergencyContact = updateData.emergencyContact;
    }

    if (updateData.emergencyPhone !== undefined) {
      updateSchema.emergencyPhone = updateData.emergencyPhone;
    }

    if (updateData.address !== undefined) {
      updateSchema.address = updateData.address;
    }

    if (updateData.addressNumber !== undefined) {
      updateSchema.addressNumber = updateData.addressNumber;
    }

    if (updateData.complement !== undefined) {
      updateSchema.complement = updateData.complement;
    }

    if (updateData.neighborhood !== undefined) {
      updateSchema.neighborhood = updateData.neighborhood;
    }

    if (updateData.city !== undefined) {
      updateSchema.city = updateData.city;
    }

    if (updateData.state !== undefined) {
      updateSchema.state = updateData.state;
    }

    if (updateData.zipCode !== undefined) {
      updateSchema.zipCode = updateData.zipCode;
    }

    if (updateData.country !== undefined) {
      updateSchema.country = updateData.country;
    }

    if (updateData.bankCode !== undefined) {
      updateSchema.bankCode = updateData.bankCode;
    }

    if (updateData.bankName !== undefined) {
      updateSchema.bankName = updateData.bankName;
    }

    if (updateData.bankAgency !== undefined) {
      updateSchema.bankAgency = updateData.bankAgency;
    }

    if (updateData.bankAccount !== undefined) {
      updateSchema.bankAccount = updateData.bankAccount;
    }

    if (updateData.bankAccountType !== undefined) {
      updateSchema.bankAccountType = updateData.bankAccountType;
    }

    if (updateData.pixKey !== undefined) {
      updateSchema.pixKey = updateData.pixKey;
    }

    if (updateData.departmentId !== undefined) {
      updateSchema.departmentId = updateData.departmentId
        ? new UniqueEntityID(updateData.departmentId)
        : null;
    }

    if (updateData.positionId !== undefined) {
      updateSchema.positionId = updateData.positionId
        ? new UniqueEntityID(updateData.positionId)
        : null;
    }

    if (updateData.supervisorId !== undefined) {
      updateSchema.supervisorId = updateData.supervisorId
        ? new UniqueEntityID(updateData.supervisorId)
        : null;
    }

    if (updateData.hireDate !== undefined) {
      updateSchema.hireDate = updateData.hireDate;
    }

    if (updateData.baseSalary !== undefined) {
      updateSchema.baseSalary = updateData.baseSalary;
    }

    if (updateData.contractType !== undefined) {
      updateSchema.contractType = this.mapContractType(updateData.contractType);
    }

    if (updateData.workRegime !== undefined) {
      updateSchema.workRegime = this.mapWorkRegime(updateData.workRegime);
    }

    if (updateData.weeklyHours !== undefined) {
      updateSchema.weeklyHours = updateData.weeklyHours;
    }

    if (updateData.photoUrl !== undefined) {
      updateSchema.photoUrl = updateData.photoUrl;
    }

    if (updateData.metadata !== undefined) {
      updateSchema.metadata = updateData.metadata;
    }

    const updatedEmployee = await this.employeesRepository.update(updateSchema);

    if (!updatedEmployee) {
      throw new Error('Failed to update employee');
    }

    return {
      employee: updatedEmployee,
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
