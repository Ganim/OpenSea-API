import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';

const VALID_CATEGORIES = [
  'ONBOARDING',
  'SAFETY',
  'TECHNICAL',
  'COMPLIANCE',
  'LEADERSHIP',
  'SOFT_SKILLS',
] as const;

const VALID_FORMATS = ['PRESENCIAL', 'ONLINE', 'HIBRIDO'] as const;

interface CreateTrainingProgramE2EProps {
  tenantId: string;
  name?: string;
  description?: string;
  category?: string;
  format?: string;
  durationHours?: number;
  instructor?: string;
  maxParticipants?: number;
  isActive?: boolean;
  isMandatory?: boolean;
  validityMonths?: number;
}

/**
 * Creates a training program directly in the database for E2E tests
 */
export async function createTrainingProgramE2E(
  override: CreateTrainingProgramE2EProps,
) {
  const trainingProgram = await prisma.trainingProgram.create({
    data: {
      tenantId: override.tenantId,
      name:
        override.name ??
        `${faker.helpers.arrayElement([...VALID_CATEGORIES])} - ${faker.company.name()}`,
      description: override.description ?? faker.lorem.sentence(),
      category:
        override.category ?? faker.helpers.arrayElement([...VALID_CATEGORIES]),
      format: override.format ?? faker.helpers.arrayElement([...VALID_FORMATS]),
      durationHours:
        override.durationHours ?? faker.number.int({ min: 2, max: 40 }),
      instructor: override.instructor ?? faker.person.fullName(),
      maxParticipants: override.maxParticipants,
      isActive: override.isActive ?? true,
      isMandatory: override.isMandatory ?? false,
      validityMonths: override.validityMonths,
    },
  });

  return {
    trainingProgram,
    trainingProgramId: trainingProgram.id,
  };
}

/**
 * Generates training program data for API requests
 */
export function generateTrainingProgramData(
  override: Partial<CreateTrainingProgramE2EProps> = {},
) {
  return {
    name:
      override.name ??
      `${faker.helpers.arrayElement([...VALID_CATEGORIES])} - ${faker.company.name()}`,
    description: override.description ?? faker.lorem.sentence(),
    category:
      override.category ?? faker.helpers.arrayElement([...VALID_CATEGORIES]),
    format: override.format ?? faker.helpers.arrayElement([...VALID_FORMATS]),
    durationHours:
      override.durationHours ?? faker.number.int({ min: 2, max: 40 }),
    instructor: override.instructor ?? faker.person.fullName(),
    maxParticipants: override.maxParticipants,
    isMandatory: override.isMandatory ?? false,
    validityMonths: override.validityMonths,
  };
}
