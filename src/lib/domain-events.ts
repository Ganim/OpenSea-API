/**
 * Domain Event Bus — In-process pub/sub for decoupled cross-module communication.
 *
 * Use cases emit events after completing their primary operation.
 * Subscribers (registered at startup) handle side-effects asynchronously.
 *
 * Events are fire-and-forget: subscriber failures are logged but don't
 * affect the emitting use case. This is intentional — side-effects like
 * calendar sync should not block or fail the primary operation.
 *
 * Enhanced features:
 * - Consumer registration with names (for tracking processed_by)
 * - Retry with exponential backoff for failed consumers
 * - Optional EventLog persistence to PostgreSQL
 */

import { randomUUID } from 'node:crypto';

// Lazy import to avoid @env initialization in unit tests
let _logger: {
  error: (obj: unknown, msg: string) => void;
  warn: (obj: unknown, msg: string) => void;
  info: (msg: string) => void;
} | null = null;
function getLogger() {
  if (!_logger) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const imported = require('@/lib/logger').logger;
      _logger = {
        error: imported.error.bind(imported),
        warn: imported.warn.bind(imported),
        info: imported.info.bind(imported),
      };
    } catch {
      _logger = {
        error: (obj, msg) => console.error(msg, obj),
        warn: (obj, msg) => console.warn(msg, obj),
        info: (msg) => console.info(msg),
      };
    }
  }
  return _logger!;
}

// ─── Event Types ───────────────────────────────────────────────────────────

export interface DomainEvent<T = unknown> {
  type: string;
  tenantId: string;
  userId: string;
  payload: T;
  occurredAt: Date;
}

/**
 * Enhanced domain event with metadata for persistence and tracing.
 * Backward-compatible with DomainEvent — all new fields are optional.
 */
export interface EnhancedDomainEvent<T = unknown> extends DomainEvent<T> {
  /** Unique event identifier (auto-generated if not provided) */
  eventId?: string;
  /** Event schema version for forward compatibility */
  version?: number;
  /** Module that originated the event (e.g. 'sales', 'hr') */
  source?: string;
  /** Entity type that triggered the event (e.g. 'Customer', 'Deal') */
  sourceEntityType?: string;
  /** ID of the entity that triggered the event */
  sourceEntityId?: string;
  /** Correlation ID for tracing related events across a workflow */
  correlationId?: string;
  /** ID of the event that caused this event (event chain) */
  causationId?: string;
}

// HR Events
export interface AbsenceApprovedEvent {
  absenceId: string;
  absenceType: string;
  employeeName: string;
  startDate: Date;
  endDate: Date;
}

export interface AbsenceRequestedEvent {
  absenceId: string;
  absenceType: string;
  employeeName: string;
  startDate: Date;
  endDate: Date;
}

export interface EmployeeCreatedEvent {
  employeeId: string;
  employeeName: string;
  birthDate?: Date;
}

export interface EmployeeUpdatedEvent {
  employeeId: string;
  employeeName: string;
  birthDate?: Date;
}

// Finance Events
export interface FinanceEntryCreatedEvent {
  entryId: string;
  entryType: 'PAYABLE' | 'RECEIVABLE';
  description: string;
  dueDate: Date;
}

export interface PaymentRegisteredEvent {
  entryId: string;
  entryType: 'PAYABLE' | 'RECEIVABLE';
  description: string;
  paidAt: Date;
}

// Stock Events
export interface PurchaseOrderCreatedEvent {
  poId: string;
  poNumber: string;
  supplierName: string;
  expectedDate: Date;
}

export interface PurchaseOrderCancelledEvent {
  poId: string;
  poNumber: string;
}

// Sales Events
export interface CustomerCreatedEvent {
  customerId: string;
  customerName: string;
  customerType: string;
  email?: string;
}

export interface CustomerUpdatedEvent {
  customerId: string;
  customerName: string;
  changedFields: string[];
}

export interface DealCreatedEvent {
  dealId: string;
  dealTitle: string;
  pipelineId: string;
  stageId: string;
  customerId?: string;
  value?: number;
}

export interface DealStageChangedEvent {
  dealId: string;
  dealTitle: string;
  fromStageId: string;
  fromStageName: string;
  toStageId: string;
  toStageName: string;
  pipelineId: string;
}

export interface DealWonEvent {
  dealId: string;
  dealTitle: string;
  value: number;
  customerId?: string;
  pipelineId: string;
}

export interface DealLostEvent {
  dealId: string;
  dealTitle: string;
  lossReason?: string;
  customerId?: string;
  pipelineId: string;
}

// ─── Event Type Constants ──────────────────────────────────────────────────

export const DOMAIN_EVENTS = {
  // HR
  HR_ABSENCE_APPROVED: 'hr.absence.approved',
  HR_ABSENCE_REQUESTED: 'hr.absence.requested',
  HR_EMPLOYEE_CREATED: 'hr.employee.created',
  HR_EMPLOYEE_UPDATED: 'hr.employee.updated',
  // Finance
  FINANCE_ENTRY_CREATED: 'finance.entry.created',
  FINANCE_PAYMENT_REGISTERED: 'finance.payment.registered',
  // Stock
  STOCK_PO_CREATED: 'stock.purchase-order.created',
  STOCK_PO_CANCELLED: 'stock.purchase-order.cancelled',
  // Sales
  SALES_CUSTOMER_CREATED: 'sales.customer.created',
  SALES_CUSTOMER_UPDATED: 'sales.customer.updated',
  SALES_DEAL_CREATED: 'sales.deal.created',
  SALES_DEAL_STAGE_CHANGED: 'sales.deal.stage-changed',
  SALES_DEAL_WON: 'sales.deal.won',
  SALES_DEAL_LOST: 'sales.deal.lost',
} as const;

export type DomainEventType =
  (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS];

// ─── Consumer Registration ───────────────────────────────────────────────

export interface EventConsumer<T = unknown> {
  /** Unique consumer name used for tracking in processedBy */
  name: string;
  /** Event type(s) this consumer handles */
  eventTypes: string[];
  /** Handler function */
  handle: (event: DomainEvent<T>) => Promise<void>;
  /** Max retries for this consumer (default: 3) */
  maxRetries?: number;
}

// ─── Retry Configuration ─────────────────────────────────────────────────

export interface RetryConfig {
  /** Maximum number of retries (default: 3) */
  maxRetries: number;
  /** Base delay in milliseconds for exponential backoff (default: 1000) */
  baseDelayMs: number;
  /** Maximum delay cap in milliseconds (default: 30000) */
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30_000,
};

/**
 * Calculate exponential backoff delay with jitter.
 * Formula: min(baseDelay * 2^attempt + jitter, maxDelay)
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * config.baseDelayMs * 0.5;
  return Math.min(exponentialDelay + jitter, config.maxDelayMs);
}

// ─── Event Log Persistence ───────────────────────────────────────────────

interface EventLogEntry {
  id: string;
  tenantId: string;
  type: string;
  version: number;
  source: string;
  sourceEntityType: string;
  sourceEntityId: string;
  data: unknown;
  metadata: unknown | null;
  correlationId: string | null;
  causationId: string | null;
  status: 'PUBLISHED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'DEAD_LETTER';
  processedBy: string[];
  failedConsumers: Record<string, { error: string; retryCount: number }> | null;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date | null;
  processedAt: Date | null;
  createdAt: Date;
}

type PrismaLike = {
  eventLog: {
    create: (args: {
      data: Omit<EventLogEntry, 'createdAt'>;
    }) => Promise<EventLogEntry>;
    update: (args: {
      where: { id: string };
      data: Partial<EventLogEntry>;
    }) => Promise<EventLogEntry>;
  };
};

// ─── Event Bus ─────────────────────────────────────────────────────────────

type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void>;

interface RegisteredConsumer {
  name: string;
  handler: EventHandler;
  maxRetries: number;
}

class DomainEventBus {
  private handlers = new Map<string, EventHandler[]>();
  private consumers = new Map<string, RegisteredConsumer[]>();
  private persistenceEnabled = false;
  private prismaClient: PrismaLike | null = null;

  /**
   * Register a handler for a specific event type.
   * Multiple handlers can be registered for the same event.
   * (Legacy API — backward compatible)
   */
  on<T = unknown>(eventType: string, handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler as EventHandler);
    this.handlers.set(eventType, existing);
  }

  /**
   * Register a named consumer for one or more event types.
   * Named consumers support retry tracking and EventLog persistence.
   */
  register<T = unknown>(consumer: EventConsumer<T>): void {
    const registeredConsumer: RegisteredConsumer = {
      name: consumer.name,
      handler: consumer.handle as EventHandler,
      maxRetries: consumer.maxRetries ?? DEFAULT_RETRY_CONFIG.maxRetries,
    };

    for (const eventType of consumer.eventTypes) {
      const existing = this.consumers.get(eventType) ?? [];
      existing.push(registeredConsumer);
      this.consumers.set(eventType, existing);
    }
  }

  /**
   * Enable EventLog persistence to PostgreSQL.
   * Uses lazy Prisma import to avoid breaking unit tests.
   */
  enablePersistence(prismaClient?: PrismaLike): void {
    if (prismaClient) {
      this.prismaClient = prismaClient;
    } else {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        this.prismaClient = require('@/lib/prisma').prisma;
      } catch {
        getLogger().warn(
          {},
          '[DomainEvents] Failed to load Prisma client — persistence disabled',
        );
        return;
      }
    }
    this.persistenceEnabled = true;
  }

  /**
   * Disable EventLog persistence (useful for tests).
   */
  disablePersistence(): void {
    this.persistenceEnabled = false;
    this.prismaClient = null;
  }

  /**
   * Emit an event. All registered handlers AND named consumers are called concurrently.
   * Failures are logged but do NOT propagate to the caller.
   */
  async emit<T>(event: DomainEvent<T>): Promise<void> {
    const enhancedEvent = event as EnhancedDomainEvent<T>;
    const eventId = enhancedEvent.eventId ?? randomUUID();

    // Persist to EventLog if enabled
    if (this.persistenceEnabled && this.prismaClient) {
      await this.persistEvent(eventId, enhancedEvent);
    }

    // Run legacy handlers (fire-and-forget, no retry)
    const legacyHandlers = this.handlers.get(event.type) ?? [];
    const registeredConsumers = this.consumers.get(event.type) ?? [];

    if (legacyHandlers.length === 0 && registeredConsumers.length === 0) return;

    // Execute legacy handlers
    const legacyResults = await Promise.allSettled(
      legacyHandlers.map((handler) => handler(event as DomainEvent)),
    );

    for (const result of legacyResults) {
      if (result.status === 'rejected') {
        getLogger().error(
          { event: event.type, error: result.reason },
          `[DomainEvents] Handler failed for event "${event.type}"`,
        );
      }
    }

    // Execute named consumers with retry support
    const consumerResults = await Promise.allSettled(
      registeredConsumers.map((consumer) =>
        this.executeConsumerWithRetry(consumer, event as DomainEvent, eventId),
      ),
    );

    // Update EventLog status based on consumer results
    if (
      this.persistenceEnabled &&
      this.prismaClient &&
      registeredConsumers.length > 0
    ) {
      await this.updateEventLogAfterProcessing(
        eventId,
        registeredConsumers,
        consumerResults,
      );
    }
  }

  /**
   * Execute a named consumer with retry and exponential backoff.
   */
  private async executeConsumerWithRetry(
    consumer: RegisteredConsumer,
    event: DomainEvent,
    eventId: string,
    attempt = 0,
  ): Promise<{ consumerName: string; success: boolean; error?: string }> {
    try {
      await consumer.handler(event);
      return { consumerName: consumer.name, success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (attempt < consumer.maxRetries) {
        const delayMs = calculateBackoffDelay(attempt);

        getLogger().warn(
          {
            event: event.type,
            consumer: consumer.name,
            attempt: attempt + 1,
            maxRetries: consumer.maxRetries,
            delayMs,
            eventId,
          },
          `[DomainEvents] Consumer "${consumer.name}" failed (attempt ${attempt + 1}/${consumer.maxRetries}), retrying in ${delayMs}ms`,
        );

        await this.delay(delayMs);
        return this.executeConsumerWithRetry(
          consumer,
          event,
          eventId,
          attempt + 1,
        );
      }

      getLogger().error(
        {
          event: event.type,
          consumer: consumer.name,
          error: errorMessage,
          eventId,
        },
        `[DomainEvents] Consumer "${consumer.name}" exhausted all ${consumer.maxRetries} retries for event "${event.type}"`,
      );

      return {
        consumerName: consumer.name,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Persist an event to the EventLog table.
   */
  private async persistEvent<T>(
    eventId: string,
    event: EnhancedDomainEvent<T>,
  ): Promise<void> {
    try {
      await this.prismaClient!.eventLog.create({
        data: {
          id: eventId,
          tenantId: event.tenantId,
          type: event.type,
          version: event.version ?? 1,
          source: event.source ?? 'unknown',
          sourceEntityType: event.sourceEntityType ?? 'unknown',
          sourceEntityId: event.sourceEntityId ?? 'unknown',
          data: event.payload as object,
          metadata:
            event.correlationId || event.causationId
              ? {
                  correlationId: event.correlationId,
                  causationId: event.causationId,
                }
              : null,
          correlationId: event.correlationId ?? null,
          causationId: event.causationId ?? null,
          status: 'PUBLISHED',
          processedBy: [],
          failedConsumers: null,
          retryCount: 0,
          maxRetries: 3,
          nextRetryAt: null,
          processedAt: null,
        },
      });
    } catch (persistError) {
      // Persistence failure should NOT prevent the event from being processed
      getLogger().error(
        { eventId, event: event.type, error: persistError },
        `[DomainEvents] Failed to persist event "${event.type}" to EventLog`,
      );
    }
  }

  /**
   * Update EventLog after all consumers have been processed.
   */
  private async updateEventLogAfterProcessing(
    eventId: string,
    consumers: RegisteredConsumer[],
    results: PromiseSettledResult<{
      consumerName: string;
      success: boolean;
      error?: string;
    }>[],
  ): Promise<void> {
    try {
      const processedConsumers: string[] = [];
      const failedConsumers: Record<
        string,
        { error: string; retryCount: number }
      > = {};

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const consumer = consumers[i];

        if (result.status === 'fulfilled' && result.value.success) {
          processedConsumers.push(consumer.name);
        } else {
          const errorMessage =
            result.status === 'rejected'
              ? result.reason instanceof Error
                ? result.reason.message
                : String(result.reason)
              : (result.value.error ?? 'Unknown error');

          failedConsumers[consumer.name] = {
            error: errorMessage,
            retryCount: consumer.maxRetries,
          };
        }
      }

      const allSucceeded = Object.keys(failedConsumers).length === 0;

      await this.prismaClient!.eventLog.update({
        where: { id: eventId },
        data: {
          status: allSucceeded ? 'PROCESSED' : 'FAILED',
          processedBy: processedConsumers,
          failedConsumers:
            Object.keys(failedConsumers).length > 0 ? failedConsumers : null,
          processedAt: allSucceeded ? new Date() : null,
        },
      });
    } catch (updateError) {
      getLogger().error(
        { eventId, error: updateError },
        `[DomainEvents] Failed to update EventLog status for event "${eventId}"`,
      );
    }
  }

  /** Promisified delay for retry backoff */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Remove all handlers and consumers (useful for tests).
   */
  clear(): void {
    this.handlers.clear();
    this.consumers.clear();
  }

  /**
   * Get the number of registered handlers for an event type (legacy + consumers).
   */
  handlerCount(eventType: string): number {
    const legacyCount = this.handlers.get(eventType)?.length ?? 0;
    const consumerCount = this.consumers.get(eventType)?.length ?? 0;
    return legacyCount + consumerCount;
  }

  /**
   * Get names of all registered consumers for an event type.
   */
  consumerNames(eventType: string): string[] {
    return (this.consumers.get(eventType) ?? []).map((c) => c.name);
  }

  /**
   * Get total number of unique consumers registered across all event types.
   */
  get totalConsumerCount(): number {
    const uniqueNames = new Set<string>();
    for (const consumers of this.consumers.values()) {
      for (const consumer of consumers) {
        uniqueNames.add(consumer.name);
      }
    }
    return uniqueNames.size;
  }
}

// Singleton instance
export const domainEventBus = new DomainEventBus();
