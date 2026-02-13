import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { DeleteUserByIdUseCase } from '../delete-user-by-id';

export function makeDeleteUserByIdUseCase() {
  const usersRepository = new PrismaUsersRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  return new DeleteUserByIdUseCase(usersRepository, employeesRepository);
}
