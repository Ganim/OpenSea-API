import { Permission } from '@/entities/rbac/permission';
import { PermissionsRepository } from '@/repositories/rbac/permissions-repository';

interface PermissionsByModule {
  module: string;
  description: string;
  resources: Record<
    string,
    {
      description: string;
      permissions: Array<{
        id: string;
        code: string;
        name: string;
        action: string;
        isDeprecated: boolean;
      }>;
    }
  >;
}

interface ListAllPermissionsUseCaseResponse {
  permissions: PermissionsByModule[];
  total: number;
  modules: string[];
}

/**
 * Use case para listar todas as permissões agrupadas por módulo e recurso
 *
 * Retorna permissões organizadas de forma hierárquica:
 * - Por módulo (CORE, STOCK, SALES, etc)
 * - Por recurso dentro de cada módulo
 * - Todas as ações disponíveis para cada recurso
 */
export class ListAllPermissionsUseCase {
  constructor(private permissionsRepository: PermissionsRepository) {}

  async execute(): Promise<ListAllPermissionsUseCaseResponse> {
    // Busca todas as permissões do sistema
    const permissions = await this.permissionsRepository.listAll();

    // Agrupa permissões por módulo e recurso
    const groupedByModule = this.groupPermissionsByModule(permissions);

    // Monta a resposta final
    const permissionsByModule = Object.entries(groupedByModule).map(
      ([moduleName, moduleData]) => ({
        module: moduleName,
        description: this.getModuleDescription(moduleName),
        resources: moduleData,
      }),
    );

    return {
      permissions: permissionsByModule,
      total: permissions.length,
      modules: Object.keys(groupedByModule),
    };
  }

  private groupPermissionsByModule(permissions: Permission[]): Record<
    string,
    Record<
      string,
      {
        description: string;
        permissions: Array<{
          id: string;
          code: string;
          name: string;
          action: string;
          isDeprecated: boolean;
        }>;
      }
    >
  > {
    const grouped: Record<
      string,
      Record<
        string,
        {
          description: string;
          permissions: Array<{
            id: string;
            code: string;
            name: string;
            action: string;
            isDeprecated: boolean;
          }>;
        }
      >
    > = {};

    for (const permission of permissions) {
      const module = permission.module.toUpperCase();
      const resource = permission.resource;

      // Inicializa módulo se não existir
      if (!grouped[module]) {
        grouped[module] = {};
      }

      // Inicializa recurso se não existir
      if (!grouped[module][resource]) {
        grouped[module][resource] = {
          description: this.getResourceDescription(module, resource),
          permissions: [],
        };
      }

      // Verifica se a permissão está deprecated
      const metadata = permission.metadata as Record<string, unknown>;
      const isDeprecated = metadata?.deprecated === true;

      // Adiciona a permissão ao recurso
      grouped[module][resource].permissions.push({
        id: permission.id.toString(),
        code: permission.code.value,
        name: permission.name,
        action: permission.action,
        isDeprecated,
      });
    }

    // Ordena as permissões dentro de cada recurso
    for (const module of Object.keys(grouped)) {
      for (const resource of Object.keys(grouped[module])) {
        grouped[module][resource].permissions.sort((a, b) =>
          a.action.localeCompare(b.action),
        );
      }
    }

    return grouped;
  }

  private getModuleDescription(module: string): string {
    const descriptions: Record<string, string> = {
      CORE: 'Funcionalidade central do sistema incluindo usuários, sessões e perfis',
      STOCK:
        'Gerenciamento de inventário e estoque incluindo produtos, variantes e itens',
      SALES: 'Gerenciamento de vendas e clientes',
      RBAC: 'Controle de Acesso Baseado em Função',
      REQUESTS: 'Sistema de requisições e fluxo de trabalho',
      HR: 'Gerenciamento de Recursos Humanos',
    };

    return descriptions[module] || 'No description available';
  }

  private getResourceDescription(module: string, resource: string): string {
    const descriptions: Record<string, Record<string, string>> = {
      CORE: {
        users: 'User management',
        sessions: 'Session management',
        profiles: 'User profile management',
      },
      STOCK: {
        products: 'Product management',
        variants: 'Product variant management',
        items: 'Individual item management',
        movements: 'Stock movement tracking',
        suppliers: 'Supplier management',
        manufacturers: 'Manufacturer management',
        locations: 'Storage location management',
        categories: 'Product category management',
        tags: 'Product tag management',
        templates: 'Product template management',
        'purchase-orders': 'Purchase order management',
      },
      SALES: {
        customers: 'Customer management',
        orders: 'Sales order management',
        promotions: 'Promotion management',
        reservations: 'Item reservation management',
        comments: 'Comment management',
        notifications: 'Notification management',
      },
      RBAC: {
        permissions: 'Permission management',
        groups: 'Permission group management',
        audit: 'Audit log access',
      },
      REQUESTS: {
        requests: 'Request management',
        comments: 'Request comment management',
        attachments: 'Request attachment management',
      },
      HR: {
        employees: 'Employee management',
        departments: 'Department management',
        positions: 'Position management',
        absences: 'Absence management',
        vacations: 'Vacation management',
        'time-entries': 'Time entry management',
        overtime: 'Overtime management',
        payroll: 'Payroll management',
        bonuses: 'Bonus management',
        deductions: 'Deduction management',
      },
    };

    return descriptions[module]?.[resource] || 'No description available';
  }
}
