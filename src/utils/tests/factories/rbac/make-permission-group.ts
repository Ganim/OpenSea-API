import { makeCreatePermissionGroupUseCase } from '@/use-cases/rbac/permission-groups/factories/make-create-permission-group-use-case';
import { faker } from '@faker-js/faker';

interface MakePermissionGroupOptions {
  name?: string;
  description?: string;
  color?: string;
  priority?: number;
  isSystem?: boolean;
  isActive?: boolean;
  parentId?: string;
  tenantId?: string | null;
}

export async function makePermissionGroup(
  options: MakePermissionGroupOptions = {},
) {
  // Add unique suffix to name if not explicitly provided to avoid slug collisions
  const baseName = options.name ?? faker.company.buzzPhrase();
  const uniqueSuffix = options.name
    ? ''
    : ` ${faker.string.alpha({ length: 6 }).toLowerCase()}`;
  const name = `${baseName}${uniqueSuffix}`;
  const slug = name.toLowerCase().replace(/\s+/g, '-');

  const createPermissionGroupUseCase = makeCreatePermissionGroupUseCase();

  const { group } = await createPermissionGroupUseCase.execute({
    name,
    slug,
    description: options.description ?? faker.lorem.sentence(),
    color: options.color ?? faker.internet.color(),
    priority: options.priority ?? faker.number.int({ min: 0, max: 1000 }),
    isSystem: options.isSystem ?? false,
    isActive: options.isActive ?? true,
    parentId: options.parentId ?? null,
    tenantId: options.tenantId ?? null,
  });

  return group;
}
