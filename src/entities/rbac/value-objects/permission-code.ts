import { BadRequestError } from '@/@errors/use-cases/bad-request-error';

/**
 * Value Object para código de permissão
 *
 * Formato: module.resource.action
 * Exemplos:
 * - core.users.create
 * - stock.products.read
 * - stock.*.read (wildcard para todas as operações de leitura)
 * - *.products.* (wildcard completo)
 */
export class PermissionCode {
  private readonly _value: string;
  private readonly _module: string;
  private readonly _resource: string;
  private readonly _action: string;
  private readonly _isWildcard: boolean;

  private constructor(
    value: string,
    module: string,
    resource: string,
    action: string,
  ) {
    this._value = value;
    this._module = module;
    this._resource = resource;
    this._action = action;
    this._isWildcard = value.includes('*');
  }

  /**
   * Cria um PermissionCode a partir de uma string
   * @param value String no formato module.resource.action
   */
  static create(value: string): PermissionCode {
    if (!PermissionCode.isValid(value)) {
      throw new BadRequestError(
        `Permission code '${value}' is invalid. Format: module.resource.action`,
      );
    }

    const [module, resource, action] = value.split('.');

    return new PermissionCode(value, module, resource, action);
  }

  /**
   * Cria um PermissionCode a partir de partes individuais
   * @param module Módulo (core, stock, sales, rbac)
   * @param resource Recurso (users, products, orders, etc)
   * @param action Ação (create, read, update, delete, etc)
   */
  static createFromParts(
    module: string,
    resource: string,
    action: string,
  ): PermissionCode {
    const value = `${module}.${resource}.${action}`;
    return PermissionCode.create(value);
  }

  /**
   * Valida o formato do código de permissão
   */
  static isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    const parts = value.split('.');

    // Deve ter exatamente 3 partes
    if (parts.length !== 3) {
      return false;
    }

    // Cada parte deve ter pelo menos 1 caractere
    if (parts.some((part) => !part || part.length === 0)) {
      return false;
    }

    // Partes podem ser wildcards (*) ou strings alfanuméricas com hífens e underscores
    const validPattern = /^[a-z0-9*_-]+$/i;

    return parts.every((part) => validPattern.test(part));
  }

  /**
   * Verifica se este código corresponde a outro (suporta wildcards)
   *
   * Exemplos:
   * - "stock.*.read" matches "stock.products.read"
   * - "*.products.*" matches "stock.products.create"
   * - "*.*.*" matches qualquer permissão
   */
  matches(other: PermissionCode): boolean {
    // Se não tem wildcard, deve ser exatamente igual
    if (!this._isWildcard && !other._isWildcard) {
      return this._value === other._value;
    }

    // Verifica cada parte
    const moduleMatch =
      this._module === '*' ||
      other._module === '*' ||
      this._module === other._module;
    const resourceMatch =
      this._resource === '*' ||
      other._resource === '*' ||
      this._resource === other._resource;
    const actionMatch =
      this._action === '*' ||
      other._action === '*' ||
      this._action === other._action;

    return moduleMatch && resourceMatch && actionMatch;
  }

  get value(): string {
    return this._value;
  }

  get module(): string {
    return this._module;
  }

  get resource(): string {
    return this._resource;
  }

  get action(): string {
    return this._action;
  }

  get isWildcard(): boolean {
    return this._isWildcard;
  }

  toString(): string {
    return this._value;
  }

  equals(other: PermissionCode): boolean {
    return this._value === other._value;
  }
}
