import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  PIS,
  WorkRegime,
} from '@/entities/hr/value-objects';
import type { Prisma } from '@prisma/client';

export function mapEmployeePrismaToDomain(
  employeeDb: Prisma.EmployeeGetPayload<{
    include: {
      user: true;
      department: true;
      position: true;
      supervisor: true;
    };
  }>,
) {
  return {
    registrationNumber: employeeDb.registrationNumber,
    userId: employeeDb.userId
      ? new UniqueEntityID(employeeDb.userId)
      : undefined,
    fullName: employeeDb.fullName,
    socialName: employeeDb.socialName ?? undefined,
    birthDate: employeeDb.birthDate ?? undefined,
    gender: employeeDb.gender ?? undefined,
    maritalStatus: employeeDb.maritalStatus ?? undefined,
    nationality: employeeDb.nationality ?? undefined,
    birthPlace: employeeDb.birthPlace ?? undefined,
    cpf: CPF.create(employeeDb.cpf),
    rg: employeeDb.rg ?? undefined,
    rgIssuer: employeeDb.rgIssuer ?? undefined,
    rgIssueDate: employeeDb.rgIssueDate ?? undefined,
    pis: employeeDb.pis ? PIS.create(employeeDb.pis) : undefined,
    ctpsNumber: employeeDb.ctpsNumber ?? undefined,
    ctpsSeries: employeeDb.ctpsSeries ?? undefined,
    ctpsState: employeeDb.ctpsState ?? undefined,
    voterTitle: employeeDb.voterTitle ?? undefined,
    militaryDoc: employeeDb.militaryDoc ?? undefined,
    email: employeeDb.email ?? undefined,
    personalEmail: employeeDb.personalEmail ?? undefined,
    phone: employeeDb.phone ?? undefined,
    mobilePhone: employeeDb.mobilePhone ?? undefined,
    emergencyContact: employeeDb.emergencyContact ?? undefined,
    emergencyPhone: employeeDb.emergencyPhone ?? undefined,
    address: employeeDb.address ?? undefined,
    addressNumber: employeeDb.addressNumber ?? undefined,
    complement: employeeDb.complement ?? undefined,
    neighborhood: employeeDb.neighborhood ?? undefined,
    city: employeeDb.city ?? undefined,
    state: employeeDb.state ?? undefined,
    zipCode: employeeDb.zipCode ?? undefined,
    country: employeeDb.country,
    bankCode: employeeDb.bankCode ?? undefined,
    bankName: employeeDb.bankName ?? undefined,
    bankAgency: employeeDb.bankAgency ?? undefined,
    bankAccount: employeeDb.bankAccount ?? undefined,
    bankAccountType: employeeDb.bankAccountType ?? undefined,
    pixKey: employeeDb.pixKey ?? undefined,
    departmentId: employeeDb.departmentId
      ? new UniqueEntityID(employeeDb.departmentId)
      : undefined,
    positionId: employeeDb.positionId
      ? new UniqueEntityID(employeeDb.positionId)
      : undefined,
    supervisorId: employeeDb.supervisorId
      ? new UniqueEntityID(employeeDb.supervisorId)
      : undefined,
    hireDate: employeeDb.hireDate,
    terminationDate: employeeDb.terminationDate ?? undefined,
    status: EmployeeStatus.create(employeeDb.status),
    baseSalary: Number(employeeDb.baseSalary),
    contractType: ContractType.create(employeeDb.contractType),
    workRegime: WorkRegime.create(employeeDb.workRegime),
    weeklyHours: Number(employeeDb.weeklyHours),
    photoUrl: employeeDb.photoUrl ?? undefined,
    metadata: employeeDb.metadata as Record<string, unknown>,
  };
}
