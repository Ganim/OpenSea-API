import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { AuditAction } from './audit-action.enum';
import { AuditEntity } from './audit-entity.enum';
import { AuditModule } from './audit-module.enum';

export interface AuditLogUserPermissionGroup {
  id: string;
  name: string;
  slug: string;
}

export interface AuditLogProps {
  action: AuditAction;
  entity: AuditEntity;
  module: AuditModule;
  entityId: string;
  description: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;

  // Request metadata
  ip: string | null;
  userAgent: string | null;
  endpoint: string | null;
  method: string | null;

  // User info
  userId: UniqueEntityID | null;
  affectedUser: string | null;
  userName: string | null;
  userPermissionGroups: AuditLogUserPermissionGroup[];

  createdAt: Date;
  expiresAt: Date | null;
}

/**
 * Entidade AuditLog
 *
 * Registra todas as ações realizadas no sistema para auditoria e compliance.
 * Captura o estado antes e depois de operações CRUD, informações do usuário
 * e contexto da requisição.
 */
export class AuditLog extends Entity<AuditLogProps> {
  get action(): AuditAction {
    return this.props.action;
  }

  get entity(): AuditEntity {
    return this.props.entity;
  }

  get module(): AuditModule {
    return this.props.module;
  }

  get entityId(): string {
    return this.props.entityId;
  }

  get description(): string | null {
    return this.props.description;
  }

  get oldData(): Record<string, unknown> | null {
    return this.props.oldData;
  }

  get newData(): Record<string, unknown> | null {
    return this.props.newData;
  }

  get ip(): string | null {
    return this.props.ip;
  }

  get userAgent(): string | null {
    return this.props.userAgent;
  }

  get endpoint(): string | null {
    return this.props.endpoint;
  }

  get method(): string | null {
    return this.props.method;
  }

  get userId(): UniqueEntityID | null {
    return this.props.userId;
  }

  get affectedUser(): string | null {
    return this.props.affectedUser;
  }

  get userName(): string | null {
    return this.props.userName;
  }

  get userPermissionGroups(): AuditLogUserPermissionGroup[] {
    return this.props.userPermissionGroups;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get expiresAt(): Date | null {
    return this.props.expiresAt;
  }

  /**
   * Verifica se o log é de uma ação de criação
   */
  get isCreateAction(): boolean {
    return this.props.action === AuditAction.CREATE;
  }

  /**
   * Verifica se o log é de uma ação de atualização
   */
  get isUpdateAction(): boolean {
    return this.props.action === AuditAction.UPDATE;
  }

  /**
   * Verifica se o log é de uma ação de exclusão
   */
  get isDeleteAction(): boolean {
    return this.props.action === AuditAction.DELETE;
  }

  /**
   * Verifica se o log já expirou
   */
  get hasExpired(): boolean {
    if (!this.props.expiresAt) return false;
    return new Date() > this.props.expiresAt;
  }

  /**
   * Obtém as diferenças entre oldData e newData
   */
  getDiff(): Record<string, { old: unknown; new: unknown }> | null {
    if (!this.props.oldData || !this.props.newData) {
      return null;
    }

    const diff: Record<string, { old: unknown; new: unknown }> = {};
    const allKeys = new Set([
      ...Object.keys(this.props.oldData),
      ...Object.keys(this.props.newData),
    ]);

    for (const key of allKeys) {
      const oldValue = this.props.oldData[key];
      const newValue = this.props.newData[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        diff[key] = { old: oldValue, new: newValue };
      }
    }

    return Object.keys(diff).length > 0 ? diff : null;
  }

  static create(
    props: Optional<
      AuditLogProps,
      | 'createdAt'
      | 'description'
      | 'oldData'
      | 'newData'
      | 'ip'
      | 'userAgent'
      | 'endpoint'
      | 'method'
      | 'userId'
      | 'affectedUser'
      | 'userName'
      | 'userPermissionGroups'
      | 'expiresAt'
    >,
    id?: UniqueEntityID,
  ) {
    const auditLog = new AuditLog(
      {
        ...props,
        description: props.description ?? null,
        oldData: props.oldData ?? null,
        newData: props.newData ?? null,
        ip: props.ip ?? null,
        userAgent: props.userAgent ?? null,
        endpoint: props.endpoint ?? null,
        method: props.method ?? null,
        userId: props.userId ?? null,
        affectedUser: props.affectedUser ?? null,
        userName: props.userName ?? null,
        userPermissionGroups: props.userPermissionGroups ?? [],
        expiresAt: props.expiresAt ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return auditLog;
  }
}
