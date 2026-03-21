import type { SystemSkillDefinition } from '@/entities/core/system-skill-definition';

export interface SystemSkillDefinitionsRepository {
  findByCode(code: string): Promise<SystemSkillDefinition | null>;
  findByModule(module: string): Promise<SystemSkillDefinition[]>;
  findAll(): Promise<SystemSkillDefinition[]>;
  findByParentSkillCode(code: string): Promise<SystemSkillDefinition[]>;
  create(entity: SystemSkillDefinition): Promise<void>;
  save(entity: SystemSkillDefinition): Promise<void>;
}
