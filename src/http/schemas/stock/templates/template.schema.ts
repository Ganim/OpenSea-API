/**
 * TEMPLATE SCHEMAS
 */

import { z } from 'zod';

export const careLabelSchema = z.object({
  washing: z.string().optional(),
  drying: z.string().optional(),
  ironing: z.string().optional(),
  bleaching: z.string().optional(),
  dryClean: z.string().optional(),
  composition: z
    .array(
      z.object({
        fiber: z.string(),
        percentage: z.number().min(0).max(100),
      }),
    )
    .optional(),
});

/**
 * Schema para definição de atributo de template
 * Cada atributo tem tipo, configurações de exibição e unidade de medida
 */
export const templateAttributeSchema = z.object({
  /** Tipo do dado do atributo */
  type: z.enum(['string', 'number', 'boolean', 'date', 'select']),
  /** Rótulo de exibição do atributo (ex: "Marca", "Cor", "Tamanho") */
  label: z.string().max(100).optional(),
  /** Se o atributo é obrigatório */
  required: z.boolean().optional().default(false),
  /** Valor padrão do atributo */
  defaultValue: z.unknown().optional(),
  /** Unidade de medida (ex: "kg", "cm", "m²", "un") */
  unitOfMeasure: z.string().max(20).optional(),
  /** Se o atributo deve ser incluído na impressão/etiqueta */
  enablePrint: z.boolean().optional().default(false),
  /** Se o atributo deve ser exibido na visualização */
  enableView: z.boolean().optional().default(true),
  /** Opções disponíveis (apenas para type: 'select') */
  options: z.array(z.string()).optional(),
  /** Descrição do atributo */
  description: z.string().max(500).optional(),
  /** Máscara de entrada (ex: "###.###.###-##" para CPF, "(##) #####-####" para telefone) */
  mask: z.string().max(100).optional(),
  /** Texto de placeholder para o campo de entrada */
  placeholder: z.string().max(200).optional(),
});

/**
 * Schema para mapa de atributos (chave: nome do atributo, valor: definição)
 */
export const templateAttributesMapSchema = z.record(
  z.string(),
  templateAttributeSchema,
);

export const createTemplateSchema = z.object({
  code: z
    .string()
    .regex(/^\d{3}$/, 'Code must be exactly 3 digits (e.g., 001, 042)')
    .optional(), // Código hierárquico manual (auto-gerado se não fornecido)
  name: z.string().min(1).max(100),
  iconUrl: z.string().url().max(512).optional(),
  unitOfMeasure: z
    .enum(['METERS', 'KILOGRAMS', 'UNITS'])
    .optional()
    .default('UNITS'),
  productAttributes: templateAttributesMapSchema.optional(),
  variantAttributes: templateAttributesMapSchema.optional(),
  itemAttributes: templateAttributesMapSchema.optional(),
  careLabel: careLabelSchema.optional(),
  isActive: z.boolean().optional().default(true),
});

export const templateResponseSchema = z.object({
  id: z.uuid(),
  code: z.string().nullable(), // Código hierárquico (3 dígitos: 001)
  sequentialCode: z.number().nullable(),
  name: z.string(),
  iconUrl: z.string().nullable(),
  unitOfMeasure: z.string(),
  productAttributes: templateAttributesMapSchema,
  variantAttributes: templateAttributesMapSchema,
  itemAttributes: templateAttributesMapSchema,
  careLabel: careLabelSchema.nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
  deletedAt: z.coerce.date().nullable(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

// Types inferidos dos schemas
export type TemplateAttributeInput = z.infer<typeof templateAttributeSchema>;
export type TemplateAttributesMapInput = z.infer<
  typeof templateAttributesMapSchema
>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type TemplateResponse = z.infer<typeof templateResponseSchema>;
