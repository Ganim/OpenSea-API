import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import { CPF, EmployeeStatus, PIS } from '@/entities/hr/value-objects';
import type {
  CreateEmployeeSchema,
  EmployeesRepository,
  UpdateEmployeeSchema,
} from '../employees-repository';

export class InMemoryEmployeesRepository implements EmployeesRepository {
  private items: Employee[] = [];

  async create(data: CreateEmployeeSchema): Promise<Employee> {
    const id = new UniqueEntityID();
    const employee = Employee.create(
      {
        registrationNumber: data.registrationNumber,
        userId: data.userId,
        fullName: data.fullName,
        socialName: data.socialName,
        birthDate: data.birthDate,
        gender: data.gender,
        maritalStatus: data.maritalStatus,
        nationality: data.nationality,
        birthPlace: data.birthPlace,
        cpf: data.cpf,
        rg: data.rg,
        rgIssuer: data.rgIssuer,
        rgIssueDate: data.rgIssueDate,
        pis: data.pis,
        ctpsNumber: data.ctpsNumber,
        ctpsSeries: data.ctpsSeries,
        ctpsState: data.ctpsState,
        voterTitle: data.voterTitle,
        militaryDoc: data.militaryDoc,
        email: data.email,
        personalEmail: data.personalEmail,
        phone: data.phone,
        mobilePhone: data.mobilePhone,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        address: data.address,
        addressNumber: data.addressNumber,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        bankCode: data.bankCode,
        bankName: data.bankName,
        bankAgency: data.bankAgency,
        bankAccount: data.bankAccount,
        bankAccountType: data.bankAccountType,
        pixKey: data.pixKey,
        departmentId: data.departmentId,
        positionId: data.positionId,
        supervisorId: data.supervisorId,
        hireDate: data.hireDate,
        terminationDate: data.terminationDate,
        status: data.status,
        baseSalary: data.baseSalary,
        contractType: data.contractType,
        workRegime: data.workRegime,
        weeklyHours: data.weeklyHours,
        photoUrl: data.photoUrl,
        metadata: data.metadata || {},
      },
      id,
    );

    this.items.push(employee);
    return employee;
  }

  async findById(id: UniqueEntityID): Promise<Employee | null> {
    const employee = this.items.find(
      (item) => item.id.equals(id) && !item.deletedAt,
    );
    return employee || null;
  }

  async findByRegistrationNumber(
    registrationNumber: string,
  ): Promise<Employee | null> {
    const employee = this.items.find(
      (item) =>
        item.registrationNumber === registrationNumber && !item.deletedAt,
    );
    return employee || null;
  }

  async findByCpf(cpf: CPF): Promise<Employee | null> {
    const employee = this.items.find(
      (item) => item.cpf.equals(cpf) && !item.deletedAt,
    );
    return employee || null;
  }

  async findByUserId(userId: UniqueEntityID): Promise<Employee | null> {
    const employee = this.items.find(
      (item) => item.userId?.equals(userId) && !item.deletedAt,
    );
    return employee || null;
  }

  async findByPis(pis: PIS): Promise<Employee | null> {
    const employee = this.items.find(
      (item) => item.pis?.equals(pis) && !item.deletedAt,
    );
    return employee || null;
  }

  async findMany(): Promise<Employee[]> {
    return this.items.filter((item) => !item.deletedAt);
  }

  async findManyByStatus(status: EmployeeStatus): Promise<Employee[]> {
    return this.items.filter(
      (item) => item.status.equals(status) && !item.deletedAt,
    );
  }

  async findManyByDepartment(
    departmentId: UniqueEntityID,
  ): Promise<Employee[]> {
    return this.items.filter(
      (item) => item.departmentId?.equals(departmentId) && !item.deletedAt,
    );
  }

  async findManyByPosition(positionId: UniqueEntityID): Promise<Employee[]> {
    return this.items.filter(
      (item) => item.positionId?.equals(positionId) && !item.deletedAt,
    );
  }

  async findManyBySupervisor(
    supervisorId: UniqueEntityID,
  ): Promise<Employee[]> {
    return this.items.filter(
      (item) => item.supervisorId?.equals(supervisorId) && !item.deletedAt,
    );
  }

  async findManyActive(): Promise<Employee[]> {
    return this.items.filter(
      (item) => item.status.value === 'ACTIVE' && !item.deletedAt,
    );
  }

  async findManyTerminated(): Promise<Employee[]> {
    return this.items.filter(
      (item) => item.status.value === 'TERMINATED' && !item.deletedAt,
    );
  }

  async update(data: UpdateEmployeeSchema): Promise<Employee | null> {
    const employeeIndex = this.items.findIndex((item) =>
      item.id.equals(data.id),
    );

    if (employeeIndex === -1) return null;

    const existingEmployee = this.items[employeeIndex];

    // Create updated employee with merged data
    const updatedEmployee = Employee.create(
      {
        registrationNumber:
          data.registrationNumber ?? existingEmployee.registrationNumber,
        userId:
          data.userId !== undefined
            ? data.userId || undefined
            : existingEmployee.userId,
        fullName: data.fullName ?? existingEmployee.fullName,
        socialName:
          data.socialName !== undefined
            ? data.socialName || undefined
            : existingEmployee.socialName,
        birthDate:
          data.birthDate !== undefined
            ? data.birthDate || undefined
            : existingEmployee.birthDate,
        gender:
          data.gender !== undefined
            ? data.gender || undefined
            : existingEmployee.gender,
        maritalStatus:
          data.maritalStatus !== undefined
            ? data.maritalStatus || undefined
            : existingEmployee.maritalStatus,
        nationality:
          data.nationality !== undefined
            ? data.nationality || undefined
            : existingEmployee.nationality,
        birthPlace:
          data.birthPlace !== undefined
            ? data.birthPlace || undefined
            : existingEmployee.birthPlace,
        cpf: data.cpf ?? existingEmployee.cpf,
        rg: data.rg !== undefined ? data.rg || undefined : existingEmployee.rg,
        rgIssuer:
          data.rgIssuer !== undefined
            ? data.rgIssuer || undefined
            : existingEmployee.rgIssuer,
        rgIssueDate:
          data.rgIssueDate !== undefined
            ? data.rgIssueDate || undefined
            : existingEmployee.rgIssueDate,
        pis:
          data.pis !== undefined ? data.pis || undefined : existingEmployee.pis,
        ctpsNumber:
          data.ctpsNumber !== undefined
            ? data.ctpsNumber || undefined
            : existingEmployee.ctpsNumber,
        ctpsSeries:
          data.ctpsSeries !== undefined
            ? data.ctpsSeries || undefined
            : existingEmployee.ctpsSeries,
        ctpsState:
          data.ctpsState !== undefined
            ? data.ctpsState || undefined
            : existingEmployee.ctpsState,
        voterTitle:
          data.voterTitle !== undefined
            ? data.voterTitle || undefined
            : existingEmployee.voterTitle,
        militaryDoc:
          data.militaryDoc !== undefined
            ? data.militaryDoc || undefined
            : existingEmployee.militaryDoc,
        email:
          data.email !== undefined
            ? data.email || undefined
            : existingEmployee.email,
        personalEmail:
          data.personalEmail !== undefined
            ? data.personalEmail || undefined
            : existingEmployee.personalEmail,
        phone:
          data.phone !== undefined
            ? data.phone || undefined
            : existingEmployee.phone,
        mobilePhone:
          data.mobilePhone !== undefined
            ? data.mobilePhone || undefined
            : existingEmployee.mobilePhone,
        emergencyContact:
          data.emergencyContact !== undefined
            ? data.emergencyContact || undefined
            : existingEmployee.emergencyContact,
        emergencyPhone:
          data.emergencyPhone !== undefined
            ? data.emergencyPhone || undefined
            : existingEmployee.emergencyPhone,
        address:
          data.address !== undefined
            ? data.address || undefined
            : existingEmployee.address,
        addressNumber:
          data.addressNumber !== undefined
            ? data.addressNumber || undefined
            : existingEmployee.addressNumber,
        complement:
          data.complement !== undefined
            ? data.complement || undefined
            : existingEmployee.complement,
        neighborhood:
          data.neighborhood !== undefined
            ? data.neighborhood || undefined
            : existingEmployee.neighborhood,
        city:
          data.city !== undefined
            ? data.city || undefined
            : existingEmployee.city,
        state:
          data.state !== undefined
            ? data.state || undefined
            : existingEmployee.state,
        zipCode:
          data.zipCode !== undefined
            ? data.zipCode || undefined
            : existingEmployee.zipCode,
        country: data.country ?? existingEmployee.country,
        bankCode:
          data.bankCode !== undefined
            ? data.bankCode || undefined
            : existingEmployee.bankCode,
        bankName:
          data.bankName !== undefined
            ? data.bankName || undefined
            : existingEmployee.bankName,
        bankAgency:
          data.bankAgency !== undefined
            ? data.bankAgency || undefined
            : existingEmployee.bankAgency,
        bankAccount:
          data.bankAccount !== undefined
            ? data.bankAccount || undefined
            : existingEmployee.bankAccount,
        bankAccountType:
          data.bankAccountType !== undefined
            ? data.bankAccountType || undefined
            : existingEmployee.bankAccountType,
        pixKey:
          data.pixKey !== undefined
            ? data.pixKey || undefined
            : existingEmployee.pixKey,
        departmentId:
          data.departmentId !== undefined
            ? data.departmentId || undefined
            : existingEmployee.departmentId,
        positionId:
          data.positionId !== undefined
            ? data.positionId || undefined
            : existingEmployee.positionId,
        supervisorId:
          data.supervisorId !== undefined
            ? data.supervisorId || undefined
            : existingEmployee.supervisorId,
        hireDate: data.hireDate ?? existingEmployee.hireDate,
        terminationDate:
          data.terminationDate !== undefined
            ? data.terminationDate || undefined
            : existingEmployee.terminationDate,
        status: data.status ?? existingEmployee.status,
        baseSalary: data.baseSalary ?? existingEmployee.baseSalary,
        contractType: data.contractType ?? existingEmployee.contractType,
        workRegime: data.workRegime ?? existingEmployee.workRegime,
        weeklyHours: data.weeklyHours ?? existingEmployee.weeklyHours,
        photoUrl:
          data.photoUrl !== undefined
            ? data.photoUrl || undefined
            : existingEmployee.photoUrl,
        metadata: data.metadata ?? existingEmployee.metadata,
      },
      existingEmployee.id,
    );

    this.items[employeeIndex] = updatedEmployee;
    return updatedEmployee;
  }

  async save(employee: Employee): Promise<void> {
    const employeeIndex = this.items.findIndex((item) =>
      item.id.equals(employee.id),
    );

    if (employeeIndex !== -1) {
      this.items[employeeIndex] = employee;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const employeeIndex = this.items.findIndex((item) => item.id.equals(id));

    if (employeeIndex !== -1) {
      const employee = this.items[employeeIndex];
      employee.softDelete();
    }
  }
}
