/**
 * Typed interface for the Tenant `settings` JSON field.
 * Each section represents a configurable area of the system.
 * Settings are stored as partial JSON and resolved with defaults at runtime.
 */
export interface TenantSettings {
  general: {
    timezone: string;
    locale: string;
    currency: string;
    dateFormat: string;
  };
  branding: {
    primaryColor: string;
    accentColor: string;
    faviconUrl: string | null;
  };
  stock: {
    allowNegativeStock: boolean;
    defaultWarehouseId: string | null;
    autoGenerateBarcode: boolean;
    barcodePrefix: string;
  };
  sales: {
    defaultPaymentTermsDays: number;
    requireApprovalAbove: number;
    defaultTaxRate: number;
  };
  hr: {
    workHoursPerDay: number;
    overtimeMultiplier: number;
    vacationDaysPerYear: number;
  };
  notifications: {
    emailSenderName: string;
    emailSenderAddress: string;
    enableSlack: boolean;
    slackWebhookUrl: string | null;
  };
  security: {
    sessionTimeoutMinutes: number;
    maxFailedLoginAttempts: number;
    requireMfa: boolean;
    passwordMinLength: number;
    ipWhitelist: string[];
  };
}

/**
 * Default values for all tenant settings.
 * Used when a tenant hasn't customized a specific setting.
 */
export const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  general: {
    timezone: 'America/Sao_Paulo',
    locale: 'pt-BR',
    currency: 'BRL',
    dateFormat: 'DD/MM/YYYY',
  },
  branding: {
    primaryColor: '#1a73e8',
    accentColor: '#f59e0b',
    faviconUrl: null,
  },
  stock: {
    allowNegativeStock: false,
    defaultWarehouseId: null,
    autoGenerateBarcode: true,
    barcodePrefix: 'OS',
  },
  sales: {
    defaultPaymentTermsDays: 30,
    requireApprovalAbove: 5000,
    defaultTaxRate: 0.18,
  },
  hr: {
    workHoursPerDay: 8,
    overtimeMultiplier: 1.5,
    vacationDaysPerYear: 30,
  },
  notifications: {
    emailSenderName: 'OpenSea',
    emailSenderAddress: 'noreply@opensea.com',
    enableSlack: false,
    slackWebhookUrl: null,
  },
  security: {
    sessionTimeoutMinutes: 30,
    maxFailedLoginAttempts: 5,
    requireMfa: false,
    passwordMinLength: 8,
    ipWhitelist: [],
  },
};

/**
 * Deep merge partial settings with defaults.
 * When a tenant saves only customized fields, this function
 * ensures all other fields use default values.
 *
 * @param partial - Partial settings from database (may have missing sections/fields)
 * @returns Complete TenantSettings with all fields populated
 */
export function resolveTenantSettings(
  partial: DeepPartial<TenantSettings>,
): TenantSettings {
  return deepMerge(
    DEFAULT_TENANT_SETTINGS as unknown as Record<string, unknown>,
    partial as Record<string, unknown>,
  ) as unknown as TenantSettings;
}

/**
 * Utility type for deep partial objects.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deep merge helper. Source values override target values.
 * Arrays are replaced, not merged.
 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue !== null &&
      sourceValue !== undefined &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue !== null &&
      targetValue !== undefined &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>,
      );
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue;
    }
  }

  return result;
}
