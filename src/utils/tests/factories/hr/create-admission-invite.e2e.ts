import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';

interface CreateAdmissionInviteE2EProps {
  tenantId: string;
  email?: string;
  phone?: string;
  fullName?: string;
  positionId?: string;
  departmentId?: string;
  companyId?: string;
  expectedStartDate?: Date;
  salary?: number;
  contractType?: string;
  workRegime?: string;
  status?: string;
  createdBy?: string;
  expiresAt?: Date;
}

/**
 * Creates an admission invite directly in the database for E2E tests.
 */
export async function createAdmissionInviteE2E(
  override: CreateAdmissionInviteE2EProps,
) {
  const admissionInvite = await prisma.admissionInvite.create({
    data: {
      tenantId: override.tenantId,
      email: override.email ?? faker.internet.email(),
      phone: override.phone ?? '11999999999',
      fullName: override.fullName ?? faker.person.fullName(),
      positionId: override.positionId,
      departmentId: override.departmentId,
      companyId: override.companyId,
      expectedStartDate:
        override.expectedStartDate ?? faker.date.future({ years: 1 }),
      salary:
        override.salary ??
        faker.number.float({ min: 2000, max: 15000, fractionDigits: 2 }),
      contractType: override.contractType ?? 'CLT',
      workRegime: override.workRegime ?? 'FULL_TIME',
      status: override.status ?? 'PENDING',
      createdBy: override.createdBy,
      expiresAt:
        override.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    admissionInvite,
    admissionInviteId: admissionInvite.id,
  };
}

/**
 * Generates data for creating an admission invite via API.
 */
export function generateAdmissionInviteData(
  override: Partial<Omit<CreateAdmissionInviteE2EProps, 'tenantId'>> = {},
) {
  return {
    email: override.email ?? faker.internet.email(),
    phone: override.phone ?? '11999999999',
    fullName: override.fullName ?? faker.person.fullName(),
    positionId: override.positionId,
    departmentId: override.departmentId,
    companyId: override.companyId,
    expectedStartDate: override.expectedStartDate
      ? override.expectedStartDate.toISOString()
      : faker.date.future({ years: 1 }).toISOString(),
    salary:
      override.salary ??
      faker.number.float({ min: 2000, max: 15000, fractionDigits: 2 }),
    contractType: override.contractType ?? 'CLT',
    workRegime: override.workRegime ?? 'FULL_TIME',
    expiresInDays: 7,
  };
}
