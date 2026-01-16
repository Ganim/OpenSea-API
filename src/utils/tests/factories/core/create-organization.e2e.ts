import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

interface OrganizationData {
  legalName?: string;
  cnpj?: string;
  tradeName?: string;
  type?: 'COMPANY' | 'SUPPLIER' | 'MANUFACTURER' | 'CUSTOMER';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLOCKED';
  email?: string;
  phoneMain?: string;
}

function generateCNPJ(): string {
  const part1 = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0');
  const part2 = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  const part3 = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  const part4 = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  const part5 = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0');

  return `${part1}.${part2}.${part3}/${part4}-${part5}`;
}

export function generateOrganizationData(
  overrides?: OrganizationData,
): Required<OrganizationData> {
  return {
    legalName:
      overrides?.legalName ??
      `Organization ${crypto.randomBytes(4).toString('hex')}`,
    cnpj: overrides?.cnpj ?? generateCNPJ(),
    tradeName:
      overrides?.tradeName ??
      `Trade Name ${crypto.randomBytes(4).toString('hex')}`,
    type: overrides?.type ?? 'COMPANY',
    status: overrides?.status ?? 'ACTIVE',
    email: overrides?.email ?? 'contact@organization.com',
    phoneMain: overrides?.phoneMain ?? '1133334444',
  };
}

/**
 * Creates an organization in the database for E2E tests
 */
export async function createOrganizationE2E(overrides?: OrganizationData) {
  const data = generateOrganizationData(overrides);

  const organization = await prisma.organization.create({
    data: {
      legalName: data.legalName,
      cnpj: data.cnpj,
      tradeName: data.tradeName,
      type: data.type,
      status: data.status,
      email: data.email,
      phoneMain: data.phoneMain,
      metadata: {},
    },
  });

  return {
    organization,
    organizationId: organization.id,
  };
}

/**
 * Gets or creates a default test organization
 */
export async function getOrCreateTestOrganization() {
  const existingOrg = await prisma.organization.findFirst({
    where: {
      tradeName: 'Test Organization',
      deletedAt: null,
    },
  });

  if (existingOrg) {
    return {
      organization: existingOrg,
      organizationId: existingOrg.id,
    };
  }

  return createOrganizationE2E({
    legalName: 'Test Organization LTDA',
    tradeName: 'Test Organization',
    type: 'COMPANY',
  });
}
