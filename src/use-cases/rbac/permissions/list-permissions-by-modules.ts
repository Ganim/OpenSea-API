import { Permission } from '@/entities/rbac/permission';
import type { PermissionsRepository } from '@/repositories/rbac/permissions-repository';

interface PermissionByModule {
  module: string;
  permissions: Permission[];
  total: number;
}

interface ListPermissionsByModulesRequest {
  includeSystem?: boolean;
}

interface ListPermissionsByModulesResponse {
  modules: PermissionByModule[];
  totalPermissions: number;
}

export class ListPermissionsByModulesUseCase {
  constructor(private permissionsRepository: PermissionsRepository) {}

  async execute(
    request: ListPermissionsByModulesRequest = {},
  ): Promise<ListPermissionsByModulesResponse> {
    const { includeSystem = true } = request;

    // Buscar todas as permissões
    const allPermissions = await this.permissionsRepository.listAll({
      isSystem: includeSystem ? undefined : false,
    });

    // Agrupar permissões por módulo
    const modulesMap = new Map<string, Permission[]>();

    for (const permission of allPermissions) {
      const module = permission.module;
      if (!modulesMap.has(module)) {
        modulesMap.set(module, []);
      }
      modulesMap.get(module)!.push(permission);
    }

    // Converter para o formato de resposta
    const modules: PermissionByModule[] = Array.from(modulesMap.entries())
      .map(([module, permissions]) => ({
        module,
        permissions: permissions.sort(
          (a, b) =>
            a.resource.localeCompare(b.resource) ||
            a.action.localeCompare(b.action),
        ),
        total: permissions.length,
      }))
      .sort((a, b) => a.module.localeCompare(b.module));

    return {
      modules,
      totalPermissions: allPermissions.length,
    };
  }
}
