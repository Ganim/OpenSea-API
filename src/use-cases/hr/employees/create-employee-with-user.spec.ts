import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryTenantUsersRepository } from '@/repositories/core/in-memory/in-memory-tenant-users-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import type { CreateUserUseCase } from '@/use-cases/core/users/create-user';
import type { AssignGroupToUserUseCase } from '@/use-cases/rbac/associations/assign-group-to-user';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateEmployeeWithUserUseCase } from './create-employee-with-user';

let employeesRepository: InMemoryEmployeesRepository;
let usersRepository: InMemoryUsersRepository;
let tenantUsersRepository: InMemoryTenantUsersRepository;
let sut: CreateEmployeeWithUserUseCase;
const tenantId = new UniqueEntityID().toString();

const mockCreateUserUseCase = {
  execute: async (data: { email: string }) => ({
    user: { id: 'u1', email: data.email, username: data.email },
  }),
} as unknown as CreateUserUseCase;
const mockAssignGroupUseCase = {
  execute: async () => ({}),
} as unknown as AssignGroupToUserUseCase;

describe('CreateEmployeeWithUserUseCase', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    usersRepository = new InMemoryUsersRepository();
    tenantUsersRepository = new InMemoryTenantUsersRepository();
    sut = new CreateEmployeeWithUserUseCase(
      employeesRepository,
      mockCreateUserUseCase,
      usersRepository,
      tenantUsersRepository,
      mockAssignGroupUseCase,
    );
  });

  it('should throw BadRequestError for invalid contract type', async () => {
    await expect(() =>
      sut.execute({
        tenantId,
        userEmail: 't@t.com',
        userPassword: 'P@123',
        registrationNumber: 'R1',
        fullName: 'Test',
        cpf: '529.982.247-25',
        hireDate: new Date(),
        baseSalary: 5000,
        contractType: 'INVALID',
        workRegime: 'FULL_TIME',
        weeklyHours: 44,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError for invalid work regime', async () => {
    await expect(() =>
      sut.execute({
        tenantId,
        userEmail: 't@t.com',
        userPassword: 'P@123',
        registrationNumber: 'R1',
        fullName: 'Test',
        cpf: '529.982.247-25',
        hireDate: new Date(),
        baseSalary: 5000,
        contractType: 'CLT',
        workRegime: 'INVALID',
        weeklyHours: 44,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
