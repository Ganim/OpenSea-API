/**
 * WebhookDelivery domain entity — Phase 11 / Plan 11-02.
 *
 * Cada tentativa de entrega de evento para um endpoint vira uma row
 * (D-13 log filtrável + D-21 reprocess manual com cap 3 + cooldown 30s).
 */
import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type WebhookDeliveryStatus = 'PENDING' | 'DELIVERED' | 'FAILED' | 'DEAD';

export type WebhookErrorClass =
  | 'TIMEOUT'
  | 'NETWORK'
  | 'TLS'
  | 'HTTP_4XX'
  | 'HTTP_5XX'
  | 'REDIRECT_BLOCKED'
  | 'SSRF_BLOCKED'
  | 'DNS_FAIL';

export const MAX_MANUAL_REPROCESS = 3;
export const MANUAL_REPROCESS_COOLDOWN_MS = 30 * 1000;

export interface AttemptLog {
  attempt: number;
  attemptedAt: string;
  httpStatus: number | null;
  durationMs: number | null;
  errorClass: WebhookErrorClass | null;
  errorMessage: string | null;
  responseBody: string | null;
  retryAfterSeconds: number | null;
}

export interface WebhookDeliveryProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  endpointId: UniqueEntityID;
  eventId: string;
  eventType: string;
  status: WebhookDeliveryStatus;
  attemptCount: number;
  manualReprocessCount: number;
  lastManualReprocessAt?: Date | null;
  lastAttemptAt?: Date | null;
  lastHttpStatus?: number | null;
  lastErrorClass?: WebhookErrorClass | null;
  lastErrorMessage?: string | null;
  lastDurationMs?: number | null;
  lastResponseBody?: string | null;
  lastRetryAfterSeconds?: number | null;
  attempts: AttemptLog[];
  payloadHash: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class WebhookDelivery extends Entity<WebhookDeliveryProps> {
  get tenantId() {
    return this.props.tenantId;
  }

  get endpointId() {
    return this.props.endpointId;
  }

  get eventId() {
    return this.props.eventId;
  }

  get eventType() {
    return this.props.eventType;
  }

  get status() {
    return this.props.status;
  }

  get attemptCount() {
    return this.props.attemptCount;
  }

  get manualReprocessCount() {
    return this.props.manualReprocessCount;
  }

  get lastManualReprocessAt(): Date | null {
    return this.props.lastManualReprocessAt ?? null;
  }

  get lastAttemptAt(): Date | null {
    return this.props.lastAttemptAt ?? null;
  }

  get lastHttpStatus(): number | null {
    return this.props.lastHttpStatus ?? null;
  }

  get lastErrorClass(): WebhookErrorClass | null {
    return this.props.lastErrorClass ?? null;
  }

  get lastErrorMessage(): string | null {
    return this.props.lastErrorMessage ?? null;
  }

  get lastDurationMs(): number | null {
    return this.props.lastDurationMs ?? null;
  }

  get lastResponseBody(): string | null {
    return this.props.lastResponseBody ?? null;
  }

  get lastRetryAfterSeconds(): number | null {
    return this.props.lastRetryAfterSeconds ?? null;
  }

  get attempts() {
    return this.props.attempts;
  }

  get payloadHash() {
    return this.props.payloadHash;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  /** D-21: pode reprocessar se < 3 reenvios E (sem reprocess prévio OU 30s passou) */
  canManualReprocess(now: Date = new Date()): boolean {
    if (this.props.manualReprocessCount >= MAX_MANUAL_REPROCESS) return false;
    const last = this.props.lastManualReprocessAt;
    if (!last) return true;
    return now.getTime() - last.getTime() >= MANUAL_REPROCESS_COOLDOWN_MS;
  }

  /** Increment counter local — repo deve fazer atomic via SQL increment */
  incrementManualReprocess(): {
    newCount: number;
    cappedReached: boolean;
  } {
    this.props.manualReprocessCount += 1;
    this.props.lastManualReprocessAt = new Date();
    this.touch();
    return {
      newCount: this.props.manualReprocessCount,
      cappedReached: this.props.manualReprocessCount >= MAX_MANUAL_REPROCESS,
    };
  }

  markDelivered(httpStatus: number, durationMs: number) {
    this.props.status = 'DELIVERED';
    this.props.lastHttpStatus = httpStatus;
    this.props.lastDurationMs = durationMs;
    this.props.lastAttemptAt = new Date();
    this.props.lastErrorClass = null;
    this.props.lastErrorMessage = null;
    this.touch();
  }

  markFailed(
    errorClass: WebhookErrorClass,
    message: string,
    httpStatus?: number,
  ) {
    this.props.status = 'FAILED';
    this.props.lastErrorClass = errorClass;
    this.props.lastErrorMessage = message;
    this.props.lastHttpStatus = httpStatus ?? null;
    this.props.lastAttemptAt = new Date();
    this.touch();
  }

  markDead() {
    this.props.status = 'DEAD';
    this.props.lastAttemptAt = new Date();
    this.touch();
  }

  recordAttempt(attempt: AttemptLog) {
    this.props.attempts.push(attempt);
    this.props.attemptCount = this.props.attempts.length;
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      WebhookDeliveryProps,
      | 'id'
      | 'status'
      | 'attemptCount'
      | 'manualReprocessCount'
      | 'attempts'
      | 'createdAt'
    >,
    id?: UniqueEntityID,
  ): WebhookDelivery {
    return new WebhookDelivery(
      {
        ...props,
        id: props.id ?? new UniqueEntityID(),
        status: props.status ?? 'PENDING',
        attemptCount: props.attemptCount ?? 0,
        manualReprocessCount: props.manualReprocessCount ?? 0,
        attempts: props.attempts ?? [],
        createdAt: props.createdAt ?? new Date(),
      },
      id ?? props.id,
    );
  }
}
