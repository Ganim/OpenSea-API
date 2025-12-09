import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PermissionsRepository } from '@/repositories/rbac/permissions-repository';
import type { UserDirectPermissionsRepository } from '@/repositories/rbac/user-direct-permissions-repository';

interface ListUsersByPermissionRequest {
  permissionId: string;
}

interface ListUsersByPermissionResponse {
  userIds: string[];
}

export class ListUsersByPermissionUseCase {
  constructor(
    private permissionsRepository: PermissionsRepository,
    private userDirectPermissionsRepository: UserDirectPermissionsRepository,
  ) {}

  async execute(
    request: ListUsersByPermissionRequest,
  ): Promise<ListUsersByPermissionResponse> {
    const { permissionId } = request;

    // Validar permissão existe
    const permissionIdEntity = new UniqueEntityID(permissionId);
    const permission =
      await this.permissionsRepository.findById(permissionIdEntity);

    if (!permission) {
      throw new ResourceNotFoundError('Permission not found');
    }

    // Buscar usuários que possuem esta permissão diretamente
    const userIds =
      await this.userDirectPermissionsRepository.listUsersByPermissionId(
        permissionIdEntity,
      );

    return {
      userIds: userIds.map((id) => id.toString()),
    };
  }
}
