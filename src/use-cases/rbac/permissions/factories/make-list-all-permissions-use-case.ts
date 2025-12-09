import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository'
import { ListAllPermissionsUseCase } from '../list-all-permissions'

export function makeListAllPermissionsUseCase() {
  const permissionsRepository = new PrismaPermissionsRepository()
  const useCase = new ListAllPermissionsUseCase(permissionsRepository)

  return useCase
}
