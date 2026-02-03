import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { VariantsRepository } from '@/repositories/stock/variants-repository';

export class SKU {
  private readonly sku: string;

  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new BadRequestError('SKU cannot be empty');
    }
    if (value.length > 64) {
      throw new BadRequestError('SKU must not exceed 64 characters');
    }
    this.sku = value;
  }

  static create(value: string): SKU {
    return new SKU(value);
  }

  static async generateFromName(
    name: string,
    variantsRepository: VariantsRepository,
    tenantId?: string,
  ): Promise<SKU> {
    const baseSKU = SKU.generateSKUFromName(name);
    const uniqueSKU = await SKU.generateUniqueSKU(
      baseSKU,
      variantsRepository,
      tenantId,
    );
    return new SKU(uniqueSKU);
  }

  private static generateSKUFromName(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove caracteres especiais, mantendo espaços e hífens
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens consecutivos
      .replace(/^-|-$/g, '') // Remove hífens no início e fim
      .toUpperCase()
      .substring(0, 50); // Limita a 50 caracteres para deixar espaço para contador
  }

  private static async generateUniqueSKU(
    baseSKU: string,
    variantsRepository: VariantsRepository,
    tenantId?: string,
  ): Promise<string> {
    let sku = baseSKU;
    let counter = 1;

    while (await variantsRepository.findBySKU(sku, tenantId ?? '')) {
      sku = `${baseSKU}-${counter}`;
      counter++;

      if (sku.length > 64) {
        // Se ainda assim exceder, trunca o baseSKU
        const maxBaseLength = 64 - `-${counter}`.length;
        sku = `${baseSKU.substring(0, maxBaseLength)}-${counter}`;
      }
    }

    return sku;
  }

  get value(): string {
    return this.sku;
  }

  equals(other: SKU): boolean {
    return this.sku === other.sku;
  }

  toString(): string {
    return this.sku;
  }
}
