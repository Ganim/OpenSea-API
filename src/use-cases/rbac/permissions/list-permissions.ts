import { Permission } from '@/entities/rbac/permission';
import type { PermissionsRepository } from '@/repositories/rbac/permissions-repository';

interface ListPermissionsRequest {
  module?: string;
  resource?: string;
  action?: string;
  isSystem?: boolean;
  page?: number;
  limit?: number;
}

interface ListPermissionsResponse {
  permissions: Permission[];
  total: number;
}

export class ListPermissionsUseCase {
  constructor(private permissionsRepository: PermissionsRepository) {}

  async execute(
    request: ListPermissionsRequest = {},
  ): Promise<ListPermissionsResponse> {
    const {
      module,
      resource,
      action,
      isSystem,
      page = 1,
      limit = 100,
    } = request;

    const permissions = await this.permissionsRepository.listAll({
      module,
      resource,
      action,
      isSystem,
      page,
      limit,
    });

    const total = await this.permissionsRepository.count();

    return {
      permissions,
      total,
    };
  }
}
