import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { Permission } from '@/entities/rbac/permission';
import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import type { PermissionsRepository } from '@/repositories/rbac/permissions-repository';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface PermissionsConfig {
  version: string;
  lastUpdated: string;
  modules: Record<
    string,
    {
      description: string;
      resources: Record<
        string,
        {
          description: string;
          actions: string[];
        }
      >;
    }
  >;
}

interface CreatePermissionRequest {
  code: string;
  name: string;
  description: string | null;
  module: string;
  resource: string;
  action: string;
  isSystem?: boolean;
  metadata?: Record<string, unknown>;
}

interface CreatePermissionResponse {
  permission: Permission;
}

export class CreatePermissionUseCase {
  constructor(private permissionsRepository: PermissionsRepository) {}

  async execute(
    request: CreatePermissionRequest,
  ): Promise<CreatePermissionResponse> {
    const {
      code,
      name,
      description,
      module,
      resource,
      action,
      isSystem = false,
      metadata = {},
    } = request;

    // Validar código da permissão
    const permissionCode = PermissionCode.create(code);

    // Verificar se permissão já existe
    const permissionExists =
      await this.permissionsRepository.exists(permissionCode);

    if (permissionExists) {
      throw new BadRequestError(
        `Permission with code '${code}' already exists`,
      );
    }

    // Carregar configurações das permissões do sistema
    const configPath = path.join(__dirname, '../../../../prisma/permissions.json');
    const configFile = fs.readFileSync(configPath, 'utf-8');
    const config: PermissionsConfig = JSON.parse(configFile);

    // Verificar se a permissão é do sistema (está definida no permissions.json)
    const moduleConfig = config.modules[module];
    const isSystemPermission = moduleConfig?.resources[resource]?.actions.includes(action) ?? false;

    // Criar permissão
    const permission = await this.permissionsRepository.create({
      code: permissionCode,
      name,
      description,
      module,
      resource,
      action,
      isSystem: isSystem || isSystemPermission,
      metadata,
    });

    return {
      permission,
    };
  }
}
