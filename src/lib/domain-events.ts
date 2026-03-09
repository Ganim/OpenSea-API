/**
 * Domain Event Bus — In-process pub/sub for decoupled cross-module communication.
 *
 * Use cases emit events after completing their primary operation.
 * Subscribers (registered at startup) handle side-effects asynchronously.
 *
 * Events are fire-and-forget: subscriber failures are logged but don't
 * affect the emitting use case. This is intentional — side-effects like
 * calendar sync should not block or fail the primary operation.
 */

// Lazy import to avoid @env initialization in unit tests
let _logger: { error: (obj: unknown, msg: string) => void } | null = null;
function getLogger() {
  if (!_logger) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _logger = require('@/lib/logger').logger;
    } catch {
      _logger = { error: (obj, msg) => console.error(msg, obj) };
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

// ─── Event Type Constants ──────────────────────────────────────────────────

export const DOMAIN_EVENTS = {
  HR_ABSENCE_APPROVED: 'hr.absence.approved',
  HR_ABSENCE_REQUESTED: 'hr.absence.requested',
  HR_EMPLOYEE_CREATED: 'hr.employee.created',
  HR_EMPLOYEE_UPDATED: 'hr.employee.updated',
  FINANCE_ENTRY_CREATED: 'finance.entry.created',
  FINANCE_PAYMENT_REGISTERED: 'finance.payment.registered',
  STOCK_PO_CREATED: 'stock.purchase-order.created',
  STOCK_PO_CANCELLED: 'stock.purchase-order.cancelled',
} as const;

export type DomainEventType =
  (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS];

// ─── Event Bus ─────────────────────────────────────────────────────────────

type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void>;

class DomainEventBus {
  private handlers = new Map<string, EventHandler[]>();

  /**
   * Register a handler for a specific event type.
   * Multiple handlers can be registered for the same event.
   */
  on<T = unknown>(eventType: string, handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler as EventHandler);
    this.handlers.set(eventType, existing);
  }

  /**
   * Emit an event. All registered handlers are called concurrently.
   * Failures are logged but do NOT propagate to the caller.
   */
  async emit<T>(event: DomainEvent<T>): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? [];

    if (handlers.length === 0) return;

    const results = await Promise.allSettled(
      handlers.map((handler) => handler(event as DomainEvent)),
    );

    for (const result of results) {
      if (result.status === 'rejected') {
        getLogger().error(
          { event: event.type, error: result.reason },
          `[DomainEvents] Handler failed for event "${event.type}"`,
        );
      }
    }
  }

  /**
   * Remove all handlers (useful for tests).
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * Get the number of registered handlers for an event type (useful for tests).
   */
  handlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.length ?? 0;
  }
}

// Singleton instance
export const domainEventBus = new DomainEventBus();
