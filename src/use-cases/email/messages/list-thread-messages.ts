import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { EmailMessage } from '@/entities/email/email-message';
import type { EmailMessagesRepository } from '@/repositories/email';

interface ListThreadMessagesRequest {
  tenantId: string;
  messageId: string;
}

interface ListThreadMessagesResponse {
  messages: EmailMessage[];
}

export class ListThreadMessagesUseCase {
  constructor(private emailMessagesRepository: EmailMessagesRepository) {}

  async execute(
    request: ListThreadMessagesRequest,
  ): Promise<ListThreadMessagesResponse> {
    const { tenantId, messageId } = request;

    // Fetch the target message to get its accountId and RFC messageId
    const message = await this.emailMessagesRepository.findById(
      messageId,
      tenantId,
    );

    if (!message) {
      throw new ResourceNotFoundError('Message not found');
    }

    // If message has no RFC messageId, it can't be threaded
    if (!message.messageId) {
      return { messages: [message] };
    }

    const threadMessages =
      await this.emailMessagesRepository.findThreadMessages(
        message.accountId.toString(),
        message.messageId,
        tenantId,
      );

    // If no thread found (only the message itself), return just the message
    if (threadMessages.length === 0) {
      return { messages: [message] };
    }

    // Ensure the target message is included (it might be in a different folder)
    const hasTarget = threadMessages.some((m) => m.id.toString() === messageId);
    if (!hasTarget) {
      threadMessages.push(message);
      threadMessages.sort(
        (a, b) => a.receivedAt.getTime() - b.receivedAt.getTime(),
      );
    }

    return { messages: threadMessages };
  }
}
