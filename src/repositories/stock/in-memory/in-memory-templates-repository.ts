import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Template } from '@/entities/stock/template';
import type {
  CreateTemplateSchema,
  TemplatesRepository,
  UpdateTemplateSchema,
} from '../templates-repository';

export class InMemoryTemplatesRepository implements TemplatesRepository {
  public items: Template[] = [];

  async create(data: CreateTemplateSchema): Promise<Template> {
    const template = Template.create({
      name: data.name,
      productAttributes: data.productAttributes ?? {},
      variantAttributes: data.variantAttributes ?? {},
      itemAttributes: data.itemAttributes ?? {},
    });

    this.items.push(template);
    return template;
  }

  async findById(id: UniqueEntityID): Promise<Template | null> {
    const template = this.items.find(
      (item) => !item.deletedAt && item.id.equals(id),
    );
    return template ?? null;
  }

  async findByName(name: string): Promise<Template | null> {
    const template = this.items.find(
      (item) => !item.deletedAt && item.name === name,
    );
    return template ?? null;
  }

  async findMany(): Promise<Template[]> {
    return this.items.filter((item) => !item.deletedAt);
  }

  async update(data: UpdateTemplateSchema): Promise<Template | null> {
    const template = await this.findById(data.id);
    if (!template) return null;

    if (data.name !== undefined) template.name = data.name;
    if (data.productAttributes !== undefined)
      template.productAttributes = data.productAttributes;
    if (data.variantAttributes !== undefined)
      template.variantAttributes = data.variantAttributes;
    if (data.itemAttributes !== undefined)
      template.itemAttributes = data.itemAttributes;

    return template;
  }

  async save(template: Template): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(template.id));
    if (index >= 0) {
      this.items[index] = template;
    } else {
      this.items.push(template);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const template = await this.findById(id);
    if (template) {
      template.delete();
    }
  }
}
