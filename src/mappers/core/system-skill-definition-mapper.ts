import { SystemSkillDefinition } from '@/entities/core/system-skill-definition';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  SkillPricing as PrismaSkillPricing,
  SystemSkillDefinition as PrismaSystemSkillDefinition,
} from '@prisma/generated/client';

type SkillDefinitionWithRelations = PrismaSystemSkillDefinition & {
  skillPricing?: PrismaSkillPricing | null;
  childSkills?: PrismaSystemSkillDefinition[];
};

export interface SystemSkillDefinitionDTO {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string | null;
  parentSkillCode: string | null;
  category: string;
  isCore: boolean;
  isVisible: boolean;
  iconUrl: string | null;
  requiresSetup: boolean;
  setupUrl: string | null;
  sortOrder: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export function systemSkillDefinitionPrismaToDomain(
  raw: SkillDefinitionWithRelations,
): SystemSkillDefinition {
  return SystemSkillDefinition.create(
    {
      id: new UniqueEntityID(raw.id),
      code: raw.code,
      name: raw.name,
      description: raw.description,
      module: raw.module,
      parentSkillCode: raw.parentSkillCode,
      category: raw.category,
      isCore: raw.isCore,
      isVisible: raw.isVisible,
      iconUrl: raw.iconUrl,
      requiresSetup: raw.requiresSetup,
      setupUrl: raw.setupUrl,
      sortOrder: raw.sortOrder,
      metadata: raw.metadata as Record<string, unknown>,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}

export function systemSkillDefinitionToDTO(
  skill: SystemSkillDefinition,
): SystemSkillDefinitionDTO {
  return {
    id: skill.systemSkillDefinitionId.toString(),
    code: skill.code,
    name: skill.name,
    description: skill.description,
    module: skill.module,
    parentSkillCode: skill.parentSkillCode,
    category: skill.category,
    isCore: skill.isCore,
    isVisible: skill.isVisible,
    iconUrl: skill.iconUrl,
    requiresSetup: skill.requiresSetup,
    setupUrl: skill.setupUrl,
    sortOrder: skill.sortOrder,
    metadata: skill.metadata,
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt ?? skill.createdAt,
  };
}

export function systemSkillDefinitionToPrisma(skill: SystemSkillDefinition) {
  return {
    id: skill.systemSkillDefinitionId.toString(),
    code: skill.code,
    name: skill.name,
    description: skill.description,
    module: skill.module as PrismaSystemSkillDefinition['module'],
    parentSkillCode: skill.parentSkillCode,
    category: skill.category as PrismaSystemSkillDefinition['category'],
    isCore: skill.isCore,
    isVisible: skill.isVisible,
    iconUrl: skill.iconUrl,
    requiresSetup: skill.requiresSetup,
    setupUrl: skill.setupUrl,
    sortOrder: skill.sortOrder,
    metadata: skill.metadata,
  };
}
