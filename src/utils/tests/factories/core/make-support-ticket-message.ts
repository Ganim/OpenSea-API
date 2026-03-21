import {
  SupportTicketMessage,
  type SupportTicketMessageProps,
} from '@/entities/core/support-ticket-message';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Optional } from '@/entities/domain/optional';

export function makeSupportTicketMessage(
  overrides: Partial<
    Optional<
      SupportTicketMessageProps,
      'id' | 'authorId' | 'isInternal' | 'createdAt' | 'updatedAt'
    >
  > = {},
  id?: UniqueEntityID,
): SupportTicketMessage {
  return SupportTicketMessage.create(
    {
      ticketId: overrides.ticketId ?? new UniqueEntityID().toString(),
      authorType: overrides.authorType ?? 'TENANT_USER',
      body: overrides.body ?? 'Test message body',
      ...overrides,
    },
    id,
  );
}
