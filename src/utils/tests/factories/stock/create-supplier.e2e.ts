import { prisma } from '@/lib/prisma';

interface CreateSupplierProps {
  tenantId: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  isActive?: boolean;
}

/**
 * Creates a supplier directly in the database for E2E tests.
 *
 * @example
 * const { supplier, supplierId } = await createSupplier({ tenantId });
 */
export async function createSupplier(override: CreateSupplierProps) {
  const timestamp = Date.now();

  const supplier = await prisma.supplier.create({
    data: {
      tenantId: override.tenantId,
      name: override.name ?? `Test Supplier ${timestamp}`,
      email: override.email ?? `supplier${timestamp}@test.com`,
      phone: override.phone,
      city: override.city,
      state: override.state,
      isActive: override.isActive ?? true,
    },
  });

  return {
    supplier,
    supplierId: supplier.id,
  };
}
