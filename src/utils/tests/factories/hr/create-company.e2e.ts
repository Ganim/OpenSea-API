import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

interface CompanyData {
  tenantId?: string;
  legalName?: string;
  cnpj?: string;
  tradeName?: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  legalNature?: string;
  taxRegime?:
    | 'SIMPLES'
    | 'LUCRO_PRESUMIDO'
    | 'LUCRO_REAL'
    | 'IMUNE_ISENTA'
    | 'OUTROS';
  taxRegimeDetail?: string;
  activityStartDate?: Date;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  email?: string;
  phoneMain?: string;
  phoneAlt?: string;
  logoUrl?: string;
  metadata?: Record<string, unknown>;
}

function generateCNPJ(): string {
  // Generate a random valid CNPJ format: XX.XXX.XXX/XXXX-XX
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

export function generateCompanyData(overrides?: CompanyData): CompanyData {
  return {
    legalName:
      overrides?.legalName ??
      `Company ${crypto.randomBytes(4).toString('hex')}`,
    cnpj: overrides?.cnpj ?? generateCNPJ(),
    tradeName:
      overrides?.tradeName ??
      `Trade Name ${crypto.randomBytes(4).toString('hex')}`,
    stateRegistration: overrides?.stateRegistration,
    municipalRegistration: overrides?.municipalRegistration,
    legalNature: overrides?.legalNature,
    taxRegime: overrides?.taxRegime ?? 'LUCRO_REAL',
    taxRegimeDetail: overrides?.taxRegimeDetail,
    activityStartDate: overrides?.activityStartDate,
    status: overrides?.status ?? 'ACTIVE',
    email: overrides?.email ?? 'contact@company.com',
    phoneMain: overrides?.phoneMain ?? '1133334444',
    phoneAlt: overrides?.phoneAlt,
    logoUrl: overrides?.logoUrl ?? 'https://example.com/logo.png',
    metadata: overrides?.metadata,
  };
}

// Backward compatibility
export const generateEnterpriseData = generateCompanyData;

export function generateCNPJForTest(): string {
  return generateCNPJ();
}

/**
 * Creates a company in the database for E2E tests
 */
export async function createCompanyE2E(overrides?: CompanyData) {
  const data = generateCompanyData(overrides);

  let tenantId = overrides?.tenantId;
  if (!tenantId) {
    const timestamp = Date.now();
    const tenant = await prisma.tenant.create({
      data: {
        name: `Auto Tenant ${timestamp}`,
        slug: `auto-tenant-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
        status: 'ACTIVE',
        settings: {},
        metadata: {},
      },
    });
    tenantId = tenant.id;
  }

  const company = await prisma.company.create({
    data: {
      tenantId,
      legalName: data.legalName!,
      cnpj: data.cnpj!,
      tradeName: data.tradeName,
      stateRegistration: data.stateRegistration,
      municipalRegistration: data.municipalRegistration,
      legalNature: data.legalNature,
      taxRegime: data.taxRegime,
      taxRegimeDetail: data.taxRegimeDetail,
      activityStartDate: data.activityStartDate,
      status: data.status ?? 'ACTIVE',
      email: data.email,
      phoneMain: data.phoneMain,
      phoneAlt: data.phoneAlt,
      logoUrl: data.logoUrl,
      metadata: (data.metadata ?? {}) as object,
      pendingIssues: [],
    },
  });

  return {
    company,
    companyId: company.id,
  };
}
