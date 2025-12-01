import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  PIS,
  WorkRegime,
} from '@/entities/hr/value-objects';

export interface CreateEmployeeSchema {
  registrationNumber: string;
  userId?: UniqueEntityID;
  fullName: string;
  socialName?: string;
  birthDate?: Date;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  birthPlace?: string;
  cpf: CPF;
  rg?: string;
  rgIssuer?: string;
  rgIssueDate?: Date;
  pis?: PIS;
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
  country: string;
  bankCode?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  bankAccountType?: string;
  pixKey?: string;
  departmentId?: UniqueEntityID;
  positionId?: UniqueEntityID;
  supervisorId?: UniqueEntityID;
  hireDate: Date;
  terminationDate?: Date;
  status: EmployeeStatus;
  baseSalary: number;
  contractType: ContractType;
  workRegime: WorkRegime;
  weeklyHours: number;
  photoUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateEmployeeSchema {
  id: UniqueEntityID;
  registrationNumber?: string;
  userId?: UniqueEntityID | null; // null para desvincular
  fullName?: string;
  socialName?: string | null;
  birthDate?: Date | null;
  gender?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  birthPlace?: string | null;
  cpf?: CPF;
  rg?: string | null;
  rgIssuer?: string | null;
  rgIssueDate?: Date | null;
  pis?: PIS | null;
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
  departmentId?: UniqueEntityID | null;
  positionId?: UniqueEntityID | null;
  supervisorId?: UniqueEntityID | null;
  hireDate?: Date;
  terminationDate?: Date | null;
  status?: EmployeeStatus;
  baseSalary?: number;
  contractType?: ContractType;
  workRegime?: WorkRegime;
  weeklyHours?: number;
  photoUrl?: string | null;
  metadata?: Record<string, unknown>;
}

export interface EmployeesRepository {
  create(data: CreateEmployeeSchema): Promise<Employee>;
  findById(id: UniqueEntityID): Promise<Employee | null>;
  findByRegistrationNumber(
    registrationNumber: string,
  ): Promise<Employee | null>;
  findByCpf(cpf: CPF): Promise<Employee | null>;
  findByUserId(userId: UniqueEntityID): Promise<Employee | null>;
  findByPis(pis: PIS): Promise<Employee | null>;
  findMany(): Promise<Employee[]>;
  findManyByStatus(status: EmployeeStatus): Promise<Employee[]>;
  findManyByDepartment(departmentId: UniqueEntityID): Promise<Employee[]>;
  findManyByPosition(positionId: UniqueEntityID): Promise<Employee[]>;
  findManyBySupervisor(supervisorId: UniqueEntityID): Promise<Employee[]>;
  findManyActive(): Promise<Employee[]>;
  findManyTerminated(): Promise<Employee[]>;
  update(data: UpdateEmployeeSchema): Promise<Employee | null>;
  save(employee: Employee): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
