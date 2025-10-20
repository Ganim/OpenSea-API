import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Template } from '@/entities/stock/template';
import { faker } from '@faker-js/faker';

interface MakeTemplateProps {
  name?: string;
  productAttributes?: Record<string, unknown>;
  variantAttributes?: Record<string, unknown>;
  itemAttributes?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function makeTemplate(override: MakeTemplateProps = {}): Template {
  const template = Template.create(
    {
      name: override.name ?? faker.commerce.department(),
      productAttributes: override.productAttributes ?? {},
      variantAttributes: override.variantAttributes ?? {},
      itemAttributes: override.itemAttributes ?? {},
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt,
      deletedAt: override.deletedAt,
    },
    new UniqueEntityID(),
  );

  return template;
}
