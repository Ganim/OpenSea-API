import { makeCreatePermissionUseCase } from '@/use-cases/rbac/permissions/factories/make-create-permission-use-case';
import { faker } from '@faker-js/faker';

interface MakePermissionOptions {
  code?: string; // Allow passing custom code directly
  module?: string;
  resource?: string;
  action?: string;
  name?: string;
  description?: string;
  isSystem?: boolean;
  uniqueSuffix?: string; // Add unique suffix to avoid duplicates
}

export async function makePermission(options: MakePermissionOptions = {}) {
  // If code is provided, parse it to extract module, resource, action
  let module: string;
  let resource: string;
  let action: string;
  let code: string;

  if (options.code) {
    // Use the provided code directly
    code = options.code;
    const parts = code.split('.');
    module = parts[0];
    resource = parts[1];
    action = parts[2];
  } else {
    // Generate unique code
    module =
      options.module ??
      faker.helpers.arrayElement(['core', 'sales', 'stock', 'rbac']);
    const baseResource = options.resource ?? faker.lorem.word().toLowerCase();
    const uniqueSuffix =
      options.uniqueSuffix ?? faker.string.alpha({ length: 6 }).toLowerCase();
    resource = `${baseResource}-${uniqueSuffix}`;
    action =
      options.action ??
      faker.helpers.arrayElement([
        'create',
        'read',
        'update',
        'delete',
        'manage',
      ]);
    code = `${module}.${resource}.${action}`;
  }

  const createPermissionUseCase = makeCreatePermissionUseCase();

  const { permission } = await createPermissionUseCase.execute({
    code,
    name: options.name ?? faker.lorem.words(3),
    description: options.description ?? faker.lorem.sentence(),
    module,
    resource,
    action,
    isSystem: options.isSystem ?? false,
    metadata: {},
  });

  return permission;
}
