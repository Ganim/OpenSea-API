/**
 * WebhookEndpoint domain entity — Phase 11 / Plan 11-02.
 *
 * Tenant-scoped, secret one-time-revealed (D-08 visible-once), com rotação
 * suave 7d (D-07 secretPrevious + secretPreviousExpiresAt) e auto-disable
 * em 10 DEAD consecutivas OU HTTP 410 Gone (D-25).
 *
 * Mirror direto do schema Prisma `webhook_endpoints` (Phase 11 / 11-01 Task 2).
 */
import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type WebhookEndpointStatus = 'ACTIVE' | 'PAUSED' | 'AUTO_DISABLED';
export type WebhookAutoDisableReason = 'CONSECUTIVE_DEAD' | 'HTTP_410_GONE';

/** Threshold de auto-disable por DEAD consecutivas — D-25 */
export const AUTO_DISABLE_DEAD_THRESHOLD = 10;

export interface WebhookEndpointProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  url: string;
  description?: string | null;
  apiVersion: string;
  subscribedEvents: string[];
  status: WebhookEndpointStatus;
  autoDisabledReason?: WebhookAutoDisableReason | null;
  autoDisabledAt?: Date | null;
  consecutiveDeadCount: number;
  /** Secret cleartext (whsec_<base64url>) — armazenado em DB para signing. NUNCA exposto via DTO público */
  secretCurrent: string;
  secretCurrentLast4: string;
  secretCurrentCreatedAt: Date;
  /** Secret antigo durante janela de rotação (7d D-07). NUNCA exposto */
  secretPrevious?: string | null;
  secretPreviousExpiresAt?: Date | null;
  lastSuccessAt?: Date | null;
  lastDeliveryAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class WebhookEndpoint extends Entity<WebhookEndpointProps> {
  get tenantId() {
    return this.props.tenantId;
  }

  get url() {
    return this.props.url;
  }

  get description() {
    return this.props.description ?? null;
  }

  set description(value: string | null) {
    this.props.description = value;
    this.touch();
  }

  get apiVersion() {
    return this.props.apiVersion;
  }

  get subscribedEvents() {
    return this.props.subscribedEvents;
  }

  set subscribedEvents(events: string[]) {
    this.props.subscribedEvents = events;
    this.touch();
  }

  get status() {
    return this.props.status;
  }

  get autoDisabledReason(): WebhookAutoDisableReason | null {
    return this.props.autoDisabledReason ?? null;
  }

  get autoDisabledAt(): Date | null {
    return this.props.autoDisabledAt ?? null;
  }

  get consecutiveDeadCount() {
    return this.props.consecutiveDeadCount;
  }

  get secretCurrent() {
    return this.props.secretCurrent;
  }

  get secretCurrentLast4() {
    return this.props.secretCurrentLast4;
  }

  get secretCurrentCreatedAt() {
    return this.props.secretCurrentCreatedAt;
  }

  get secretPrevious(): string | null {
    return this.props.secretPrevious ?? null;
  }

  get secretPreviousExpiresAt(): Date | null {
    return this.props.secretPreviousExpiresAt ?? null;
  }

  get lastSuccessAt(): Date | null {
    return this.props.lastSuccessAt ?? null;
  }

  get lastDeliveryAt(): Date | null {
    return this.props.lastDeliveryAt ?? null;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt ?? null;
  }

  set deletedAt(value: Date | null) {
    this.props.deletedAt = value;
    this.touch();
  }

  /** Active = ACTIVE && deletedAt == null — pronto para receber deliveries */
  get isActive(): boolean {
    return this.props.status === 'ACTIVE' && !this.props.deletedAt;
  }

  pause() {
    if (this.props.status === 'AUTO_DISABLED') {
      throw new Error(
        'Cannot pause an AUTO_DISABLED endpoint — call activate() first',
      );
    }
    this.props.status = 'PAUSED';
    this.touch();
  }

  /** Reactivate from PAUSED OR AUTO_DISABLED — limpa contador e reason */
  activate() {
    this.props.status = 'ACTIVE';
    this.props.autoDisabledReason = null;
    this.props.autoDisabledAt = null;
    this.props.consecutiveDeadCount = 0;
    this.touch();
  }

  /** Marca AUTO_DISABLED com motivo (D-25) */
  autoDisable(reason: WebhookAutoDisableReason) {
    this.props.status = 'AUTO_DISABLED';
    this.props.autoDisabledReason = reason;
    this.props.autoDisabledAt = new Date();
    this.touch();
  }

  /**
   * Increment consecutive DEAD count e indica se atingiu o threshold (10).
   * Use cases / worker chamam em cada DEAD; se shouldAutoDisable=true, deve
   * chamar autoDisable('CONSECUTIVE_DEAD') em seguida.
   *
   * NOTA: para consistência multi-machine, o worker usa
   * prisma.update.data: { increment: 1 } (atomic SQL). Esta versão entity-only
   * é útil para in-memory tests.
   */
  incrementDeadCount(): {
    newCount: number;
    shouldAutoDisable: boolean;
  } {
    this.props.consecutiveDeadCount += 1;
    this.touch();
    return {
      newCount: this.props.consecutiveDeadCount,
      shouldAutoDisable:
        this.props.consecutiveDeadCount >= AUTO_DISABLE_DEAD_THRESHOLD,
    };
  }

  /** Reset on success 2xx (D-25) */
  resetDeadCount() {
    this.props.consecutiveDeadCount = 0;
    this.props.lastSuccessAt = new Date();
    this.props.lastDeliveryAt = new Date();
    this.touch();
  }

  recordDeliveryAttempt() {
    this.props.lastDeliveryAt = new Date();
    this.touch();
  }

  /**
   * Rotação de secret (D-07): novo secretCurrent, last4 atualizado, secret
   * antigo migra para secretPrevious com janela 7d.
   */
  rotateSecret(newSecret: string, last4: string) {
    this.props.secretPrevious = this.props.secretCurrent;
    this.props.secretPreviousExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );
    this.props.secretCurrent = newSecret;
    this.props.secretCurrentLast4 = last4;
    this.props.secretCurrentCreatedAt = new Date();
    this.touch();
  }

  /** Limpa secret anterior expirado (chamado pelo cleanup scheduler) */
  clearExpiredPreviousSecret() {
    const exp = this.props.secretPreviousExpiresAt;
    if (exp && exp < new Date()) {
      this.props.secretPrevious = null;
      this.props.secretPreviousExpiresAt = null;
      this.touch();
    }
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      WebhookEndpointProps,
      | 'id'
      | 'apiVersion'
      | 'status'
      | 'consecutiveDeadCount'
      | 'createdAt'
      | 'secretCurrentCreatedAt'
    >,
    id?: UniqueEntityID,
  ): WebhookEndpoint {
    return new WebhookEndpoint(
      {
        ...props,
        id: props.id ?? new UniqueEntityID(),
        apiVersion: props.apiVersion ?? '2026-04-27',
        status: props.status ?? 'ACTIVE',
        consecutiveDeadCount: props.consecutiveDeadCount ?? 0,
        createdAt: props.createdAt ?? new Date(),
        secretCurrentCreatedAt: props.secretCurrentCreatedAt ?? new Date(),
      },
      id ?? props.id,
    );
  }
}
