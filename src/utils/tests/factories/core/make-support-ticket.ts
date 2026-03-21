import {
  SupportTicket,
  type SupportTicketProps,
} from '@/entities/core/support-ticket';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Optional } from '@/entities/domain/optional';

export function makeSupportTicket(
  overrides: Partial<
    Optional<
      SupportTicketProps,
      | 'id'
      | 'ticketNumber'
      | 'assigneeId'
      | 'category'
      | 'priority'
      | 'status'
      | 'resolvedAt'
      | 'closedAt'
      | 'createdAt'
      | 'updatedAt'
    >
  > = {},
  id?: UniqueEntityID,
): SupportTicket {
  return SupportTicket.create(
    {
      tenantId: overrides.tenantId ?? new UniqueEntityID().toString(),
      creatorId: overrides.creatorId ?? new UniqueEntityID().toString(),
      title: overrides.title ?? 'Test support ticket',
      ...overrides,
    },
    id,
  );
}
