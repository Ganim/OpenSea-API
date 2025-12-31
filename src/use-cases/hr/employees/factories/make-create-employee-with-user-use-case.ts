import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { CreateUserUseCase } from '@/use-cases/core/users/create-user';
import { makeAssignGroupToUserUseCase } from '@/use-cases/rbac/associations/factories/make-assign-group-to-user-use-case';
import { CreateEmployeeWithUserUseCase } from '../create-employee-with-user';

export function makeCreateEmployeeWithUserUseCase(): CreateEmployeeWithUserUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const usersRepository = new PrismaUsersRepository();
  const createUserUseCase = new CreateUserUseCase(usersRepository);
  const assignGroupToUserUseCase = makeAssignGroupToUserUseCase();
  const useCase = new CreateEmployeeWithUserUseCase(
    employeesRepository,
    createUserUseCase,
    usersRepository,
    assignGroupToUserUseCase,
  );

  return useCase;
}
