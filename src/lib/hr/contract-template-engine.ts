/**
 * Contract Template Engine
 * ------------------------------------------------------------------
 * A small, dependency-free template engine for HR contract documents.
 *
 * Supported syntax (mirrors a tiny subset of Mustache/Handlebars but
 * intentionally limited to what employment contracts actually need):
 *
 *   {{path.to.value}}              -> recursive object lookup
 *   {{date:format|path}}           -> formats a Date or ISO string
 *                                     formats: 'BR' | 'ISO' | 'long'
 *   {{currency:path}}              -> formats a number as BRL
 *   {{upper:path}}                 -> uppercases the looked-up string
 *   {{lower:path}}                 -> lowercases the looked-up string
 *   {{#if path}}...{{/if}}         -> renders inner block if value is truthy
 *   {{#unless path}}...{{/unless}} -> renders inner block if value is falsy
 *
 * Whitespace inside the placeholder braces is tolerated and ignored.
 * Unknown placeholders render as empty strings (never throw at runtime —
 * a contract should never break because a single optional field is
 * missing).
 */

export type TemplateVariables = Record<string, unknown>;

const DATE_FORMATTERS: Record<string, (value: Date) => string> = {
  BR: (value) => value.toLocaleDateString('pt-BR'),
  ISO: (value) => value.toISOString().slice(0, 10),
  long: (value) =>
    value.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
};

function lookupPath(variables: TemplateVariables, path: string): unknown {
  const segments = path.trim().split('.');
  let current: unknown = variables;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function isTruthy(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
}

function coerceToDate(value: unknown): Date | undefined {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return undefined;
}

function formatCurrency(value: unknown): string {
  const numeric =
    typeof value === 'number' ? value : Number.parseFloat(String(value));

  if (!Number.isFinite(numeric)) return '';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numeric);
}

function renderPlaceholder(
  expression: string,
  variables: TemplateVariables,
): string {
  const trimmed = expression.trim();

  // {{date:BR|path.to.value}}
  if (trimmed.startsWith('date:')) {
    const remainder = trimmed.slice('date:'.length);
    const [format, path] = remainder.split('|');
    const formatter = DATE_FORMATTERS[format?.trim() ?? 'BR'];
    if (!formatter || !path) return '';
    const dateValue = coerceToDate(lookupPath(variables, path));
    return dateValue ? formatter(dateValue) : '';
  }

  // {{currency:path}}
  if (trimmed.startsWith('currency:')) {
    const path = trimmed.slice('currency:'.length);
    return formatCurrency(lookupPath(variables, path));
  }

  // {{upper:path}}
  if (trimmed.startsWith('upper:')) {
    const path = trimmed.slice('upper:'.length);
    const value = lookupPath(variables, path);
    return value === undefined || value === null
      ? ''
      : String(value).toUpperCase();
  }

  // {{lower:path}}
  if (trimmed.startsWith('lower:')) {
    const path = trimmed.slice('lower:'.length);
    const value = lookupPath(variables, path);
    return value === undefined || value === null
      ? ''
      : String(value).toLowerCase();
  }

  // {{path.to.value}} — plain lookup
  const value = lookupPath(variables, trimmed);
  if (value === undefined || value === null) return '';
  if (value instanceof Date) return value.toLocaleDateString('pt-BR');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Renders a contract template by replacing all merge fields with
 * concrete values from the provided variables.
 *
 * Resolution order: conditional blocks first, then placeholders.
 * Conditional blocks are resolved iteratively until no more nested
 * blocks remain.
 */
export function renderTemplate(
  content: string,
  variables: TemplateVariables,
): string {
  let output = content;

  // Resolve conditional blocks iteratively to support nesting.
  // We deliberately use non-greedy matches and re-run until the body
  // stabilises.
  const conditionalPattern =
    /\{\{#(if|unless)\s+([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/;
  let safetyIterations = 0;
  while (conditionalPattern.test(output) && safetyIterations < 100) {
    output = output.replace(
      conditionalPattern,
      (_match, kind: string, path: string, inner: string) => {
        const value = lookupPath(variables, path);
        const truthy = isTruthy(value);
        const shouldRender = kind === 'if' ? truthy : !truthy;
        return shouldRender ? inner : '';
      },
    );
    safetyIterations++;
  }

  // Resolve simple placeholders
  output = output.replace(/\{\{([^{}]+)\}\}/g, (_match, expression: string) =>
    renderPlaceholder(expression, variables),
  );

  return output;
}

/**
 * Returns true if the template content references the given placeholder
 * path. Useful for validating that a template covers all required fields
 * before allowing it to be activated.
 */
export function templateReferences(content: string, path: string): boolean {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`\\{\\{[^}]*${escaped}[^}]*\\}\\}`);
  return pattern.test(content);
}
