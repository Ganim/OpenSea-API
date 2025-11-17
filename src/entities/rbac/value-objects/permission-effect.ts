import { BadRequestError } from '@/@errors/use-cases/bad-request-error';

/**
 * Value Object para efeito de permissão (allow ou deny)
 *
 * Deny sempre tem precedência sobre allow em casos de conflito
 */
export type PermissionEffectType = 'allow' | 'deny';

export class PermissionEffect {
  private readonly _value: PermissionEffectType;

  private constructor(value: PermissionEffectType) {
    this._value = value;
  }

  /**
   * Cria um efeito "allow"
   */
  static allow(): PermissionEffect {
    return new PermissionEffect('allow');
  }

  /**
   * Cria um efeito "deny"
   */
  static deny(): PermissionEffect {
    return new PermissionEffect('deny');
  }

  /**
   * Cria um PermissionEffect a partir de uma string
   */
  static create(value: string): PermissionEffect {
    if (!PermissionEffect.isValid(value)) {
      throw new BadRequestError(
        `Permission effect '${value}' is invalid. Valid values: allow, deny`,
      );
    }

    return new PermissionEffect(value as PermissionEffectType);
  }

  /**
   * Valida se o valor é um efeito válido
   */
  static isValid(value: string): value is PermissionEffectType {
    return value === 'allow' || value === 'deny';
  }

  get value(): PermissionEffectType {
    return this._value;
  }

  get isAllow(): boolean {
    return this._value === 'allow';
  }

  get isDeny(): boolean {
    return this._value === 'deny';
  }

  toString(): string {
    return this._value;
  }

  equals(other: PermissionEffect): boolean {
    return this._value === other._value;
  }
}
