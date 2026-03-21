import {
  systemSkillDefinitionPrismaToDomain,
  systemSkillDefinitionToPrisma,
} from '@/mappers/core/system-skill-definition-mapper';
import { prisma } from '@/lib/prisma';
import type { SystemSkillDefinition } from '@/entities/core/system-skill-definition';
import type { Prisma } from '@prisma/generated/client';
import type { SystemSkillDefinitionsRepository } from '../system-skill-definitions-repository';

export class PrismaSystemSkillDefinitionsRepository
  implements SystemSkillDefinitionsRepository
{
  async findByCode(code: string): Promise<SystemSkillDefinition | null> {
    const skillDb = await prisma.systemSkillDefinition.findUnique({
      where: { code },
    });
    if (!skillDb) return null;

    return systemSkillDefinitionPrismaToDomain(skillDb);
  }

  async findByModule(module: string): Promise<SystemSkillDefinition[]> {
    const skillsDb = await prisma.systemSkillDefinition.findMany({
      where: { module: module as never },
      orderBy: { sortOrder: 'asc' },
    });

    return skillsDb.map(systemSkillDefinitionPrismaToDomain);
  }

  async findAll(): Promise<SystemSkillDefinition[]> {
    const skillsDb = await prisma.systemSkillDefinition.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return skillsDb.map(systemSkillDefinitionPrismaToDomain);
  }

  async findByParentSkillCode(code: string): Promise<SystemSkillDefinition[]> {
    const skillsDb = await prisma.systemSkillDefinition.findMany({
      where: { parentSkillCode: code },
      orderBy: { sortOrder: 'asc' },
    });

    return skillsDb.map(systemSkillDefinitionPrismaToDomain);
  }

  async create(entity: SystemSkillDefinition): Promise<void> {
    const prismaData = systemSkillDefinitionToPrisma(entity);

    await prisma.systemSkillDefinition.create({
      data: prismaData as Prisma.SystemSkillDefinitionUncheckedCreateInput,
    });
  }

  async save(entity: SystemSkillDefinition): Promise<void> {
    const prismaData = systemSkillDefinitionToPrisma(entity);

    await prisma.systemSkillDefinition.update({
      where: { id: prismaData.id },
      data: prismaData as Prisma.SystemSkillDefinitionUncheckedUpdateInput,
    });
  }
}
