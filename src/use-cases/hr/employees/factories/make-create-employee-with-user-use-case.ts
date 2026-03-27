import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaAuthLinksRepository } from '@/repositories/core/prisma/prisma-auth-links-repository';
import { PrismaTenantUsersRepository } from '@/repositories/core/prisma/prisma-tenant-users-repository';
import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { CreateUserUseCase } from '@/use-cases/core/users/create-user';
import { makeAssignGroupToUserUseCase } from '@/use-cases/rbac/associations/factories/make-assign-group-to-user-use-case';
import { CreateEmployeeWithUserUseCase } from '../create-employee-with-user';

export function makeCreateEmployeeWithUserUseCase(): CreateEmployeeWithUserUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const usersRepository = new PrismaUsersRepository();
  const tenantUsersRepository = new PrismaTenantUsersRepository();
  const authLinksRepository = new PrismaAuthLinksRepository();
  const createUserUseCase = new CreateUserUseCase(
    usersRepository,
    authLinksRepository,
  );
  const assignGroupToUserUseCase = makeAssignGroupToUserUseCase();
  const transactionManager = new PrismaTransactionManager();

  return new CreateEmployeeWithUserUseCase(
    employeesRepository,
    createUserUseCase,
    usersRepository,
    tenantUsersRepository,
    assignGroupToUserUseCase,
    transactionManager,
    authLinksRepository,
  );
}
