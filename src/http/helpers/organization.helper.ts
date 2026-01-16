import { prisma } from '@/lib/prisma';

/**
 * Gets the organization ID for a user.
 * First tries to get it from the user's employee record.
 * If not found, returns the first available organization (for backwards compatibility).
 * Returns null if no organization is found.
 */
export async function getUserOrganizationId(
  userId: string,
): Promise<string | null> {
  // Try to get organization from employee record
  const employee = await prisma.employee.findUnique({
    where: { userId },
    select: { organizationId: true },
  });

  if (employee?.organizationId) {
    return employee.organizationId;
  }

  // Fallback: get the first available organization
  // This is mainly for development/testing purposes
  const organization = await prisma.organization.findFirst({
    where: { deletedAt: null },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  return organization?.id ?? null;
}

/**
 * Gets or creates a default organization for testing purposes.
 * This should only be used in development/testing environments.
 */
export async function getOrCreateDefaultOrganization(): Promise<string> {
  const existingOrg = await prisma.organization.findFirst({
    where: {
      tradeName: 'Default Organization',
      deletedAt: null,
    },
    select: { id: true },
  });

  if (existingOrg) {
    return existingOrg.id;
  }

  const newOrg = await prisma.organization.create({
    data: {
      type: 'COMPANY',
      legalName: 'Default Organization LTDA',
      tradeName: 'Default Organization',
      status: 'ACTIVE',
      metadata: {},
    },
  });

  return newOrg.id;
}
