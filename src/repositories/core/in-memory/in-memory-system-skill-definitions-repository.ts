import type { SystemSkillDefinition } from '@/entities/core/system-skill-definition';
import type { SystemSkillDefinitionsRepository } from '../system-skill-definitions-repository';

export class InMemorySystemSkillDefinitionsRepository
  implements SystemSkillDefinitionsRepository
{
  public items: SystemSkillDefinition[] = [];

  async findByCode(code: string): Promise<SystemSkillDefinition | null> {
    const skill = this.items.find((item) => item.code === code);

    return skill ?? null;
  }

  async findByModule(module: string): Promise<SystemSkillDefinition[]> {
    return this.items
      .filter((item) => item.module === module)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async findAll(): Promise<SystemSkillDefinition[]> {
    return [...this.items].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async findByParentSkillCode(code: string): Promise<SystemSkillDefinition[]> {
    return this.items
      .filter((item) => item.parentSkillCode === code)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async create(entity: SystemSkillDefinition): Promise<void> {
    this.items.push(entity);
  }

  async save(entity: SystemSkillDefinition): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(entity.id));

    if (index !== -1) {
      this.items[index] = entity;
    }
  }
}
