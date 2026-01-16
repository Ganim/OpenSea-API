import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LabelTemplate } from '@/entities/core/label-template';
import { faker } from '@faker-js/faker';

interface MakeLabelTemplateProps {
  name?: string;
  description?: string;
  isSystem?: boolean;
  width?: number;
  height?: number;
  grapesJsData?: string;
  compiledHtml?: string;
  compiledCss?: string;
  thumbnailUrl?: string;
  organizationId?: UniqueEntityID;
  createdById?: UniqueEntityID;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function makeGrapesJsData(): string {
  return JSON.stringify({
    pages: [
      {
        component: {
          type: 'wrapper',
          components: [
            {
              type: 'text',
              content: '{{productName}}',
              style: { 'font-size': '12px', 'font-weight': 'bold' },
            },
            {
              type: 'text',
              content: '{{variantName}}',
              style: { 'font-size': '10px' },
            },
            {
              type: 'text',
              content: '{{itemCode}}',
              style: { 'font-size': '8px', 'margin-top': '4px' },
            },
          ],
        },
      },
    ],
    styles: [],
  });
}

export function makeCompiledHtml(): string {
  return `<div class="label">
    <div class="product-name">{{productName}}</div>
    <div class="variant-name">{{variantName}}</div>
    <div class="item-code">{{itemCode}}</div>
  </div>`;
}

export function makeCompiledCss(): string {
  return `.label {
    font-family: Arial, sans-serif;
    padding: 4mm;
  }
  .product-name {
    font-size: 12px;
    font-weight: bold;
  }
  .variant-name {
    font-size: 10px;
  }
  .item-code {
    font-size: 8px;
    margin-top: 4px;
  }`;
}

export function makeLabelTemplate(
  override: MakeLabelTemplateProps = {},
): LabelTemplate {
  const labelTemplate = LabelTemplate.create(
    {
      name:
        override.name ??
        faker.helpers.arrayElement([
          'Etiqueta Padrão',
          'Etiqueta Vestuário',
          'Etiqueta Jóias',
          'Etiqueta Grande',
        ]),
      description:
        override.description ?? faker.commerce.productDescription().slice(0, 100),
      isSystem: override.isSystem ?? false,
      width: override.width ?? faker.number.int({ min: 30, max: 100 }),
      height: override.height ?? faker.number.int({ min: 20, max: 60 }),
      grapesJsData: override.grapesJsData ?? makeGrapesJsData(),
      compiledHtml: override.compiledHtml ?? makeCompiledHtml(),
      compiledCss: override.compiledCss ?? makeCompiledCss(),
      thumbnailUrl: override.thumbnailUrl,
      organizationId: override.organizationId ?? new UniqueEntityID(),
      createdById: override.createdById ?? new UniqueEntityID(),
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt,
      deletedAt: override.deletedAt,
    },
    new UniqueEntityID(),
  );

  return labelTemplate;
}

export function makeSystemLabelTemplate(
  override: Omit<MakeLabelTemplateProps, 'isSystem'> = {},
): LabelTemplate {
  return makeLabelTemplate({
    ...override,
    isSystem: true,
    name: override.name ?? 'Etiqueta Padrão do Sistema',
  });
}
