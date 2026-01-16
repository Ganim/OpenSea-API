import { BadRequestError } from '@/@errors/use-cases/bad-request-error';

/**
 * Value Object para código de permissão
 *
 * Formatos suportados:
 * - module (1 parte) - ex: stock, sales (permissões de menu/acesso ao módulo)
 * - module.resource (2 partes) - ex: stock.locations, stock.volumes (permissões de submenu)
 * - module.resource.action (3 partes) - ex: core.users.create, stock.products.read
 * - module.resource.action.scope (4 partes) - ex: hr.employees.read.all, hr.employees.list.team
 *
 * Wildcards:
 * - stock.*.read (wildcard para todas as operações de leitura)
 * - *.products.* (wildcard completo)
 */
export class PermissionCode {
  private readonly _value: string;
  private readonly _module: string;
  private readonly _resource: string;
  private readonly _action: string;
  private readonly _scope: string | null;
  private readonly _isWildcard: boolean;

  private constructor(
    value: string,
    module: string,
    resource: string,
    action: string,
    scope: string | null = null,
  ) {
    this._value = value;
    this._module = module;
    this._resource = resource;
    this._action = action;
    this._scope = scope;
    this._isWildcard = value.includes('*');
  }

  /**
   * Cria um PermissionCode a partir de uma string
   * Formatos suportados:
   * - module (1 parte) - ex: stock (permissão de acesso ao módulo/menu)
   * - module.resource (2 partes) - ex: stock.locations (permissão de submenu)
   * - module.resource.action (3 partes) - ex: core.users.create
   * - module.resource.action.scope (4 partes) - ex: hr.employees.read.all
   */
  static create(value: string): PermissionCode {
    if (!PermissionCode.isValid(value)) {
      throw new BadRequestError(
        `Permission code '${value}' is invalid. Format: module[.resource[.action[.scope]]]`,
      );
    }

    const parts = value.split('.');

    // Formato de 1 parte: module (resource e action são '_root')
    if (parts.length === 1) {
      const [module] = parts;
      return new PermissionCode(value, module, '_root', '_root', null);
    }

    // Formato de 2 partes: module.resource (action é '_root')
    if (parts.length === 2) {
      const [module, resource] = parts;
      return new PermissionCode(value, module, resource, '_root', null);
    }

    // Formato de 3 partes: module.resource.action
    if (parts.length === 3) {
      const [module, resource, action] = parts;
      return new PermissionCode(value, module, resource, action, null);
    }

    // Formato de 4 partes: module.resource.action.scope
    const [module, resource, action, scope] = parts;
    return new PermissionCode(value, module, resource, action, scope);
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
   * Aceita formatos:
   * - module (1 parte) - ex: stock (permissão de menu)
   * - module.resource (2 partes) - ex: stock.locations (permissão de submenu)
   * - module.resource.action (3 partes) - ex: core.users.create
   * - module.resource.action.scope (4 partes) - ex: hr.employees.read.all
   */
  static isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    const parts = value.split('.');

    // Deve ter entre 1 e 4 partes
    if (parts.length < 1 || parts.length > 4) {
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

  get scope(): string | null {
    return this._scope;
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
