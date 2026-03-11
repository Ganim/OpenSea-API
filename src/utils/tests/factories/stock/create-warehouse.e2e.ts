import { prisma } from '@/lib/prisma';

interface CreateWarehouseProps {
  tenantId: string;
  code?: string;
  name?: string;
  description?: string;
  address?: string;
  isActive?: boolean;
}

/**
 * Creates a warehouse directly in the database for E2E tests.
 *
 * @example
 * const { warehouse, warehouseId } = await createWarehouse({ tenantId });
 */
export async function createWarehouse(override: CreateWarehouseProps) {
  const timestamp = Date.now();
  const suffix = String(timestamp).slice(-4);

  const warehouse = await prisma.warehouse.create({
    data: {
      tenantId: override.tenantId,
      code: override.code ?? `W${suffix}`,
      name: override.name ?? `Test Warehouse ${timestamp}`,
      description: override.description,
      address: override.address,
      isActive: override.isActive ?? true,
    },
  });

  return {
    warehouse,
    warehouseId: warehouse.id,
  };
}
