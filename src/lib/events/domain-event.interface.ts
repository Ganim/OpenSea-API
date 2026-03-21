/**
 * Standard typed domain event interface for cross-module communication.
 *
 * Every event in the system follows this schema, enabling:
 * - Consistent event logging and auditing
 * - Correlation/causation tracing across modules
 * - Type-safe event publishing and consumption
 */
export interface DomainEvent {
  /** UUID v4 - unique event ID */
  id: string;
  /** Event type following `{module}.{entity}.{action}` convention */
  type: string;
  /** Event schema version (default: 1) */
  version: number;
  /** Tenant that this event belongs to */
  tenantId: string;
  /** Module that emitted the event: "sales", "stock", "finance", etc. */
  source: string;
  /** Entity type: "order", "product", "entry", etc. */
  sourceEntityType: string;
  /** Entity ID */
  sourceEntityId: string;
  /** Event-specific data payload */
  data: Record<string, unknown>;
  /** Optional metadata */
  metadata?: {
    userId?: string;
    correlationId?: string;
    causationId?: string;
    triggeredByAi?: boolean;
  };
  /** ISO 8601 timestamp */
  timestamp: string;
}

/**
 * Consumer interface for handling domain events.
 *
 * Consumers register with the TypedEventBus and receive events
 * matching their `subscribesTo` patterns.
 */
export interface EventConsumer {
  /** Unique consumer identifier, e.g. "stock.reservation-handler" */
  consumerId: string;
  /** Module this consumer belongs to */
  moduleId: string;
  /** Event types this consumer handles */
  subscribesTo: string[];
  /** Process the event - MUST be idempotent */
  handle(event: DomainEvent): Promise<void>;
  /** Optional retry strategy override */
  retryStrategy?: {
    maxRetries: number;
    backoffMs: number;
    deadLetterAfter: number;
  };
}
