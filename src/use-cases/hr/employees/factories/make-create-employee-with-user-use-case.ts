import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { CreateUserUseCase } from '@/use-cases/core/users/create-user';
import { CreateEmployeeWithUserUseCase } from '../create-employee-with-user';

export function makeCreateEmployeeWithUserUseCase(): CreateEmployeeWithUserUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const usersRepository = new PrismaUsersRepository();
  const createUserUseCase = new CreateUserUseCase(usersRepository);
  const useCase = new CreateEmployeeWithUserUseCase(
    employeesRepository,
    createUserUseCase,
    usersRepository,
  );

  return useCase;
}
