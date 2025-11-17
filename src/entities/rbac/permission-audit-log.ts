import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface PermissionAuditLogProps {
  id: UniqueEntityID;
  userId: UniqueEntityID;
  permissionCode: string;
  allowed: boolean;
  reason: string | null;
  resource: string | null;
  resourceId: string | null;
  action: string | null;
  ip: string | null;
  userAgent: string | null;
  endpoint: string | null;
  createdAt: Date;
}

/**
 * Entidade PermissionAuditLog
 *
 * Registra todas as verificações de permissão para auditoria e compliance.
 */
export class PermissionAuditLog extends Entity<PermissionAuditLogProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get permissionCode(): string {
    return this.props.permissionCode;
  }

  get allowed(): boolean {
    return this.props.allowed;
  }

  get reason(): string | null {
    return this.props.reason;
  }

  get resource(): string | null {
    return this.props.resource;
  }

  get resourceId(): string | null {
    return this.props.resourceId;
  }

  get action(): string | null {
    return this.props.action;
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

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get wasAllowed(): boolean {
    return this.props.allowed;
  }

  get wasDenied(): boolean {
    return !this.props.allowed;
  }

  static create(
    props: Optional<
      PermissionAuditLogProps,
      | 'createdAt'
      | 'reason'
      | 'resource'
      | 'resourceId'
      | 'action'
      | 'ip'
      | 'userAgent'
      | 'endpoint'
    >,
    id?: UniqueEntityID,
  ) {
    const auditLog = new PermissionAuditLog(
      {
        ...props,
        reason: props.reason ?? null,
        resource: props.resource ?? null,
        resourceId: props.resourceId ?? null,
        action: props.action ?? null,
        ip: props.ip ?? null,
        userAgent: props.userAgent ?? null,
        endpoint: props.endpoint ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return auditLog;
  }
}
