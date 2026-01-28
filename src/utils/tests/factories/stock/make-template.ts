import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  Template,
  TemplateAttribute,
  TemplateAttributesMap,
} from '@/entities/stock/template';
import { UnitOfMeasure } from '@/entities/stock/value-objects/unit-of-measure';
import { faker } from '@faker-js/faker';

interface MakeTemplateProps {
  name?: string;
  iconUrl?: string;
  productAttributes?: TemplateAttributesMap;
  variantAttributes?: TemplateAttributesMap;
  itemAttributes?: TemplateAttributesMap;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/**
 * Helper para criar atributos de template no novo formato tipado
 */
export function makeTemplateAttribute(
  type: TemplateAttribute['type'] = 'string',
  options?: Partial<Omit<TemplateAttribute, 'type'>>,
): TemplateAttribute {
  return {
    type,
    label: options?.label,
    required: options?.required ?? false,
    defaultValue: options?.defaultValue,
    unitOfMeasure: options?.unitOfMeasure,
    enablePrint: options?.enablePrint ?? false,
    enableView: options?.enableView ?? true,
    options: options?.options,
    description: options?.description,
    mask: options?.mask,
    placeholder: options?.placeholder,
  };
}

/**
 * Aliases para tipos comuns de atributos
 */
export const templateAttr = {
  string: (options?: Partial<Omit<TemplateAttribute, 'type'>>) =>
    makeTemplateAttribute('string', options),
  number: (options?: Partial<Omit<TemplateAttribute, 'type'>>) =>
    makeTemplateAttribute('number', options),
  boolean: (options?: Partial<Omit<TemplateAttribute, 'type'>>) =>
    makeTemplateAttribute('boolean', options),
  date: (options?: Partial<Omit<TemplateAttribute, 'type'>>) =>
    makeTemplateAttribute('date', options),
  select: (
    selectOptions: string[],
    options?: Partial<Omit<TemplateAttribute, 'type' | 'options'>>,
  ) => makeTemplateAttribute('select', { ...options, options: selectOptions }),
};

export function makeTemplate(override: MakeTemplateProps = {}): Template {
  const template = Template.create(
    {
      name: override.name ?? faker.commerce.department(),
      iconUrl: override.iconUrl,
      unitOfMeasure: UnitOfMeasure.create('UNITS'),
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
