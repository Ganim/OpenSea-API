import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type {
  TemplateAttribute,
  TemplateAttributesMap,
} from '@/entities/stock/template';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Valida os valores de atributos contra a definição do template
 * @param attributes - Os valores dos atributos a serem validados
 * @param templateAttributes - A definição de atributos do template
 * @param context - Contexto para mensagens de erro (ex: "product", "variant", "item")
 */
export function validateAttributesAgainstTemplate(
  attributes: Record<string, unknown> | undefined,
  templateAttributes: TemplateAttributesMap,
  context: string = 'entity',
): ValidationResult {
  const errors: string[] = [];
  const templateKeys = Object.keys(templateAttributes);

  // Se não há atributos definidos no template, qualquer atributo é inválido
  if (
    templateKeys.length === 0 &&
    attributes &&
    Object.keys(attributes).length > 0
  ) {
    errors.push(`Template does not define any ${context} attributes`);
    return { valid: false, errors };
  }

  // Verificar chaves inválidas (atributos que não existem no template)
  if (attributes) {
    const attributeKeys = Object.keys(attributes);
    const invalidKeys = attributeKeys.filter(
      (key) => !templateKeys.includes(key),
    );
    if (invalidKeys.length > 0) {
      errors.push(
        `Invalid attributes: ${invalidKeys.join(', ')}. Template only allows: ${templateKeys.join(', ')}`,
      );
    }
  }

  // Verificar atributos obrigatórios
  for (const [key, definition] of Object.entries(templateAttributes)) {
    if (definition.required) {
      const value = attributes?.[key];
      if (value === undefined || value === null || value === '') {
        errors.push(`Required attribute "${key}" is missing`);
      }
    }
  }

  // Validar tipos dos atributos fornecidos
  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      const definition = templateAttributes[key];
      if (!definition) continue; // Já tratado acima

      const typeError = validateAttributeType(key, value, definition);
      if (typeError) {
        errors.push(typeError);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida o tipo de um valor de atributo
 */
function validateAttributeType(
  key: string,
  value: unknown,
  definition: TemplateAttribute,
): string | null {
  // Valores nulos/undefined são permitidos para campos não obrigatórios
  if (value === null || value === undefined) {
    return null;
  }

  switch (definition.type) {
    case 'string':
      if (typeof value !== 'string') {
        return `Attribute "${key}" must be a string`;
      }
      break;

    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return `Attribute "${key}" must be a number`;
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean' && typeof value !== 'string') {
        return `Attribute "${key}" must be a boolean`;
      }
      if (typeof value === 'string') {
        const lower = value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        const validBooleans = [
          'true',
          'false',
          'sim',
          'nao',
          'não',
          'yes',
          'no',
          '1',
          '0',
        ];
        if (!validBooleans.includes(lower)) {
          return `Attribute "${key}" must be a boolean (sim/não, true/false)`;
        }
      }
      break;

    case 'date':
      if (!(value instanceof Date) && typeof value !== 'string') {
        return `Attribute "${key}" must be a date`;
      }
      // Tentar parsear se for string
      if (typeof value === 'string') {
        const parsed = new Date(value);
        if (isNaN(parsed.getTime())) {
          return `Attribute "${key}" must be a valid date`;
        }
      }
      break;

    case 'select':
      if (typeof value !== 'string') {
        return `Attribute "${key}" must be a string (select)`;
      }
      if (definition.options) {
        // Case-insensitive match para suportar importações com casing diferente
        const match = definition.options.find(
          (opt) => opt.toLowerCase().trim() === value.toLowerCase().trim(),
        );
        if (!match) {
          return `Attribute "${key}" must be one of: ${definition.options.join(', ')}`;
        }
      }
      break;
  }

  return null;
}

/**
 * Normaliza valores de atributos para o formato correto antes de salvar.
 * - Select: normaliza casing para corresponder às opções do template
 * - Boolean: converte strings ("sim"/"não") para boolean real
 * Deve ser chamado ANTES de salvar no banco, APÓS validação.
 */
export function normalizeSelectAttributes(
  attributes: Record<string, unknown> | undefined,
  templateAttributes: TemplateAttributesMap,
): Record<string, unknown> | undefined {
  if (!attributes) return attributes;

  const normalized = { ...attributes };

  for (const [key, value] of Object.entries(normalized)) {
    const definition = templateAttributes[key];
    if (!definition) continue;

    // Normaliza select: usa o casing correto do template
    if (definition.type === 'select' && definition.options && typeof value === 'string') {
      const match = definition.options.find(
        (opt) => opt.toLowerCase().trim() === value.toLowerCase().trim(),
      );
      if (match) {
        normalized[key] = match;
      }
    }

    // Normaliza boolean: converte string para boolean real
    if (definition.type === 'boolean' && typeof value === 'string') {
      const lower = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const truthy = ['true', 'sim', 'yes', '1'];
      normalized[key] = truthy.includes(lower);
    }
  }

  return normalized;
}

/**
 * Valida atributos e lança erro se inválido
 * Wrapper conveniente que lança BadRequestError
 */
export function assertValidAttributes(
  attributes: Record<string, unknown> | undefined,
  templateAttributes: TemplateAttributesMap,
  context: string = 'entity',
): void {
  const result = validateAttributesAgainstTemplate(
    attributes,
    templateAttributes,
    context,
  );

  if (!result.valid) {
    throw new BadRequestError(result.errors.join('; '));
  }
}
