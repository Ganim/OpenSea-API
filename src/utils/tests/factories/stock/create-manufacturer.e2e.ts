import { prisma } from '@/lib/prisma';

interface CreateManufacturerProps {
  tenantId: string;
  name?: string;
  country?: string;
  isActive?: boolean;
  code?: string;
}

function generateManufacturerCode(count: number) {
  const next = (count + 1) % 1000;
  return String(next).padStart(3, '0');
}

export async function createManufacturer(override: CreateManufacturerProps) {
  const timestamp = Date.now();
  const count = await prisma.manufacturer.count();

  const name = override.name ?? `Test Manufacturer ${timestamp}`;
  const code = override.code ?? generateManufacturerCode(count);

  const manufacturer = await prisma.manufacturer.create({
    data: {
      tenantId: override.tenantId,
      name,
      code,
      country: override.country ?? 'United States',
      isActive: override.isActive ?? true,
    },
  });

  return {
    manufacturer,
    manufacturerId: manufacturer.id,
  };
}
