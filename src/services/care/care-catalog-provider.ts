/**
 * Care Catalog Provider
 *
 * Loads and provides access to care instruction options from the manifest.json file.
 * This provider reads from the assets/care/manifest.json file and caches the data in memory.
 *
 * The catalog follows ISO 3758 standard for textile care labeling.
 */

import { z } from 'zod';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Care instruction categories based on ISO 3758
 */
export const CareCategory = {
  WASH: 'WASH',
  BLEACH: 'BLEACH',
  DRY: 'DRY',
  IRON: 'IRON',
  PROFESSIONAL: 'PROFESSIONAL',
} as const;

export type CareCategoryType = (typeof CareCategory)[keyof typeof CareCategory];

/**
 * Schema for a single care option from manifest.json
 */
export const careOptionSchema = z.object({
  code: z.string().min(1),
  category: z.enum(['WASH', 'BLEACH', 'DRY', 'IRON', 'PROFESSIONAL']),
  assetPath: z.string().min(1),
});

/**
 * Schema for the manifest.json file
 */
export const careManifestSchema = z.array(careOptionSchema);

/**
 * Type for a single care option
 */
export type CareOption = z.infer<typeof careOptionSchema>;

/**
 * Care option with additional computed fields for API response
 */
export interface CareOptionDTO {
  id: string;
  code: string;
  category: CareCategoryType;
  assetPath: string;
  label: string;
}

/**
 * Labels for care instructions (pt-BR)
 */
const CARE_LABELS: Record<string, string> = {
  // WASH
  WASH_30: 'Lavar a 30°C',
  WASH_40: 'Lavar a 40°C',
  WASH_50: 'Lavar a 50°C',
  WASH_60: 'Lavar a 60°C',
  WASH_70: 'Lavar a 70°C',
  WASH_95: 'Lavar a 95°C',
  WASH_NORMAL: 'Lavagem normal',
  WASH_GENTLE: 'Lavagem delicada',
  WASH_VERY_GENTLE: 'Lavagem muito delicada',
  WASH_HAND: 'Lavar à mão',
  DO_NOT_WASH: 'Não lavar',

  // BLEACH
  BLEACH_ALLOWED: 'Alvejante permitido',
  BLEACH_NON_CHLORINE: 'Apenas alvejante sem cloro',
  DO_NOT_BLEACH: 'Não usar alvejante',

  // DRY
  DRY_LINE: 'Secar em varal',
  DRY_LINE_SHADE: 'Secar em varal à sombra',
  DRY_FLAT: 'Secar na horizontal',
  DRY_FLAT_SHADE: 'Secar na horizontal à sombra',
  DRY_DRIP: 'Secar pingando',
  DRY_DRIP_SHADE: 'Secar pingando à sombra',
  TUMBLE_DRY_NORMAL: 'Secadora normal',
  TUMBLE_DRY_LOW: 'Secadora temperatura baixa',
  TUMBLE_DRY_MEDIUM: 'Secadora temperatura média',
  TUMBLE_DRY_HIGH: 'Secadora temperatura alta',
  DO_NOT_TUMBLE_DRY: 'Não usar secadora',

  // IRON
  IRON_ALLOWED: 'Passar ferro permitido',
  IRON_110: 'Passar ferro a 110°C',
  IRON_150: 'Passar ferro a 150°C',
  IRON_200: 'Passar ferro a 200°C',
  IRON_NO_STEAM: 'Passar ferro sem vapor',
  DO_NOT_IRON: 'Não passar ferro',

  // PROFESSIONAL
  DRYCLEAN_ANY: 'Lavagem a seco com qualquer solvente',
  DRYCLEAN_P: 'Lavagem a seco com percloroetileno',
  DRYCLEAN_P_GENTLE: 'Lavagem a seco suave com percloroetileno',
  DRYCLEAN_P_VERY_GENTLE: 'Lavagem a seco muito suave com percloroetileno',
  DRYCLEAN_F: 'Lavagem a seco com hidrocarbonetos',
  DRYCLEAN_F_GENTLE: 'Lavagem a seco suave com hidrocarbonetos',
  DRYCLEAN_F_VERY_GENTLE: 'Lavagem a seco muito suave com hidrocarbonetos',
  DO_NOT_DRYCLEAN: 'Não lavar a seco',
  WETCLEAN_W: 'Limpeza profissional úmida',
  WETCLEAN_W_GENTLE: 'Limpeza profissional úmida suave',
  WETCLEAN_W_VERY_GENTLE: 'Limpeza profissional úmida muito suave',
  DO_NOT_WETCLEAN: 'Não usar limpeza profissional úmida',
};

/**
 * Get the label for a care instruction code
 */
function getLabelForCode(code: string): string {
  return CARE_LABELS[code] ?? code;
}

/**
 * Care Catalog Provider
 *
 * Singleton provider that loads and caches care instruction options.
 */
export class CareCatalogProvider {
  private static instance: CareCatalogProvider | null = null;
  private options: CareOption[] = [];
  private optionsMap: Map<string, CareOption> = new Map();
  private loaded = false;

  private constructor() {
    // Private constructor to enforce singleton
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): CareCatalogProvider {
    if (!CareCatalogProvider.instance) {
      CareCatalogProvider.instance = new CareCatalogProvider();
    }
    return CareCatalogProvider.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static resetInstance(): void {
    CareCatalogProvider.instance = null;
  }

  /**
   * Get the assets directory path
   */
  private getAssetsDir(): string {
    // First check environment variable
    if (process.env.ASSETS_DIR) {
      return process.env.ASSETS_DIR;
    }

    // Use process.cwd() to get the project root directory
    // This works correctly regardless of where the code is executed from
    return path.join(process.cwd(), 'assets');
  }

  /**
   * Load the manifest file
   */
  private loadManifest(): void {
    if (this.loaded) {
      return;
    }

    const assetsDir = this.getAssetsDir();
    const manifestPath = path.join(assetsDir, 'care', 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
      throw new Error(
        `Care catalog manifest not found at: ${manifestPath}. ` +
          `Make sure the assets/care/manifest.json file exists or set ASSETS_DIR environment variable.`,
      );
    }

    try {
      const rawData = fs.readFileSync(manifestPath, 'utf-8');
      const jsonData = JSON.parse(rawData);

      // Validate with Zod schema
      const parsed = careManifestSchema.safeParse(jsonData);

      if (!parsed.success) {
        throw new Error(
          `Invalid care catalog manifest: ${parsed.error.message}`,
        );
      }

      this.options = parsed.data;
      this.optionsMap = new Map(
        this.options.map((option) => [option.code, option]),
      );
      this.loaded = true;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(
          `Failed to parse care catalog manifest: ${error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Ensure the catalog is loaded
   */
  private ensureLoaded(): void {
    if (!this.loaded) {
      this.loadManifest();
    }
  }

  /**
   * List all care options
   */
  listOptions(): CareOptionDTO[] {
    this.ensureLoaded();
    return this.options.map((option) => ({
      id: option.code,
      code: option.code,
      category: option.category,
      assetPath: option.assetPath,
      label: getLabelForCode(option.code),
    }));
  }

  /**
   * List care options grouped by category
   */
  listOptionsByCategory(): Record<CareCategoryType, CareOptionDTO[]> {
    this.ensureLoaded();

    const grouped: Record<CareCategoryType, CareOptionDTO[]> = {
      WASH: [],
      BLEACH: [],
      DRY: [],
      IRON: [],
      PROFESSIONAL: [],
    };

    for (const option of this.options) {
      grouped[option.category].push({
        id: option.code,
        code: option.code,
        category: option.category,
        assetPath: option.assetPath,
        label: getLabelForCode(option.code),
      });
    }

    return grouped;
  }

  /**
   * Get a care option by its code/ID
   */
  getOptionById(id: string): CareOptionDTO | null {
    this.ensureLoaded();

    const option = this.optionsMap.get(id);
    if (!option) {
      return null;
    }

    return {
      id: option.code,
      code: option.code,
      category: option.category,
      assetPath: option.assetPath,
      label: getLabelForCode(option.code),
    };
  }

  /**
   * Check if a care instruction ID exists
   */
  exists(id: string): boolean {
    this.ensureLoaded();
    return this.optionsMap.has(id);
  }

  /**
   * Validate multiple care instruction IDs
   * Returns array of invalid IDs, empty if all valid
   */
  validateIds(ids: string[]): string[] {
    this.ensureLoaded();
    return ids.filter((id) => !this.optionsMap.has(id));
  }

  /**
   * Get care options for multiple IDs
   * Returns only valid options, maintains order
   */
  getOptionsByIds(ids: string[]): CareOptionDTO[] {
    this.ensureLoaded();
    const result: CareOptionDTO[] = [];

    for (const id of ids) {
      const option = this.optionsMap.get(id);
      if (option) {
        result.push({
          id: option.code,
          code: option.code,
          category: option.category,
          assetPath: option.assetPath,
          label: getLabelForCode(option.code),
        });
      }
    }

    return result;
  }
}

/**
 * Export a factory function for use-case injection
 */
export function getCareCatalogProvider(): CareCatalogProvider {
  return CareCatalogProvider.getInstance();
}
