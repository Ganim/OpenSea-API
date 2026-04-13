import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';

const VALID_BENEFIT_TYPES = [
  'VT',
  'VR',
  'VA',
  'HEALTH',
  'DENTAL',
  'LIFE_INSURANCE',
  'DAYCARE',
  'PLR',
  'LOAN',
  'EDUCATION',
  'HOME_OFFICE',
  'FLEX',
] as const;

interface CreateBenefitPlanE2EProps {
  tenantId: string;
  name?: string;
  type?: string;
  provider?: string;
  policyNumber?: string;
  isActive?: boolean;
  rules?: Record<string, unknown>;
  description?: string;
}

/**
 * Creates a benefit plan directly in the database for E2E tests
 */
export async function createBenefitPlanE2E(
  override: CreateBenefitPlanE2EProps,
) {
  const benefitPlan = await prisma.benefitPlan.create({
    data: {
      tenantId: override.tenantId,
      name:
        override.name ??
        `${faker.helpers.arrayElement(VALID_BENEFIT_TYPES)} - ${faker.company.name()}`,
      type:
        override.type ?? faker.helpers.arrayElement([...VALID_BENEFIT_TYPES]),
      provider: override.provider ?? faker.company.name(),
      policyNumber:
        override.policyNumber ??
        `POL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      isActive: override.isActive ?? true,
      rules: (override.rules as any) ?? undefined,
      description: override.description ?? faker.lorem.sentence(),
    },
  });

  return {
    benefitPlan,
    benefitPlanId: benefitPlan.id,
  };
}

/**
 * Generates benefit plan data for API requests
 */
export function generateBenefitPlanData(
  override: Partial<CreateBenefitPlanE2EProps> = {},
) {
  return {
    name:
      override.name ??
      `${faker.helpers.arrayElement(VALID_BENEFIT_TYPES)} - ${faker.company.name()}`,
    type: override.type ?? faker.helpers.arrayElement([...VALID_BENEFIT_TYPES]),
    provider: override.provider ?? faker.company.name(),
    policyNumber:
      override.policyNumber ??
      `POL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    description: override.description ?? faker.lorem.sentence(),
  };
}
