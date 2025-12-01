import type { Employee } from '@/entities/hr/employee';

export interface EmployeeDTO {
  id: string;
  registrationNumber: string;
  userId?: string | null;
  fullName: string;
  socialName?: string | null;
  birthDate?: Date | null;
  gender?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  birthPlace?: string | null;
  cpf: string;
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
  country: string;
  bankCode?: string | null;
  bankName?: string | null;
  bankAgency?: string | null;
  bankAccount?: string | null;
  bankAccountType?: string | null;
  pixKey?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  supervisorId?: string | null;
  hireDate: Date;
  terminationDate?: Date | null;
  status: string;
  baseSalary: number;
  contractType: string;
  workRegime: string;
  weeklyHours: number;
  photoUrl?: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export function employeeToDTO(employee: Employee): EmployeeDTO {
  return {
    id: employee.id.toString(),
    registrationNumber: employee.registrationNumber,
    userId: employee.userId?.toString() ?? null,
    fullName: employee.fullName,
    socialName: employee.socialName ?? null,
    birthDate: employee.birthDate ?? null,
    gender: employee.gender ?? null,
    maritalStatus: employee.maritalStatus ?? null,
    nationality: employee.nationality ?? null,
    birthPlace: employee.birthPlace ?? null,
    cpf: employee.cpf.formatted,
    rg: employee.rg ?? null,
    rgIssuer: employee.rgIssuer ?? null,
    rgIssueDate: employee.rgIssueDate ?? null,
    pis: employee.pis?.formatted ?? null,
    ctpsNumber: employee.ctpsNumber ?? null,
    ctpsSeries: employee.ctpsSeries ?? null,
    ctpsState: employee.ctpsState ?? null,
    voterTitle: employee.voterTitle ?? null,
    militaryDoc: employee.militaryDoc ?? null,
    email: employee.email ?? null,
    personalEmail: employee.personalEmail ?? null,
    phone: employee.phone ?? null,
    mobilePhone: employee.mobilePhone ?? null,
    emergencyContact: employee.emergencyContact ?? null,
    emergencyPhone: employee.emergencyPhone ?? null,
    address: employee.address ?? null,
    addressNumber: employee.addressNumber ?? null,
    complement: employee.complement ?? null,
    neighborhood: employee.neighborhood ?? null,
    city: employee.city ?? null,
    state: employee.state ?? null,
    zipCode: employee.zipCode ?? null,
    country: employee.country,
    bankCode: employee.bankCode ?? null,
    bankName: employee.bankName ?? null,
    bankAgency: employee.bankAgency ?? null,
    bankAccount: employee.bankAccount ?? null,
    bankAccountType: employee.bankAccountType ?? null,
    pixKey: employee.pixKey ?? null,
    departmentId: employee.departmentId?.toString() ?? null,
    positionId: employee.positionId?.toString() ?? null,
    supervisorId: employee.supervisorId?.toString() ?? null,
    hireDate: employee.hireDate,
    terminationDate: employee.terminationDate ?? null,
    status: employee.status.value,
    baseSalary: employee.baseSalary,
    contractType: employee.contractType.value,
    workRegime: employee.workRegime.value,
    weeklyHours: employee.weeklyHours,
    photoUrl: employee.photoUrl ?? null,
    metadata: employee.metadata,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
    deletedAt: employee.deletedAt ?? null,
  };
}
