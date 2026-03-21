import { PrismaAiConversationsRepository } from '@/repositories/ai/prisma/prisma-ai-conversations-repository';
import { PrismaAiMessagesRepository } from '@/repositories/ai/prisma/prisma-ai-messages-repository';
import { PrismaAiTenantConfigRepository } from '@/repositories/ai/prisma/prisma-ai-tenant-config-repository';
import { makeAiRouter } from '@/services/ai-provider/make-ai-router';
import { SendMessageUseCase } from '../send-message';

export function makeSendMessageUseCase() {
  const conversationsRepository = new PrismaAiConversationsRepository();
  const messagesRepository = new PrismaAiMessagesRepository();
  const configRepository = new PrismaAiTenantConfigRepository();
  const aiRouter = makeAiRouter();
  return new SendMessageUseCase(
    conversationsRepository,
    messagesRepository,
    configRepository,
    aiRouter,
  );
}
