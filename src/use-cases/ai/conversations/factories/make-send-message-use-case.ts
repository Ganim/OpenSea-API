import { PrismaAiConversationsRepository } from '@/repositories/ai/prisma/prisma-ai-conversations-repository';
import { PrismaAiMessagesRepository } from '@/repositories/ai/prisma/prisma-ai-messages-repository';
import { PrismaAiTenantConfigRepository } from '@/repositories/ai/prisma/prisma-ai-tenant-config-repository';
import { makeAiRouter } from '@/services/ai-provider/make-ai-router';
import { makeToolRegistry } from '@/services/ai-tools/make-tool-registry';
import { ToolUseCaseFactory } from '@/services/ai-tools/tool-use-case-factory';
import { ToolExecutor } from '@/services/ai-tools/tool-executor';
import { makeKnowledgeRegistry } from '@/services/ai-tools/knowledge/make-knowledge-registry';
import { SendMessageUseCase } from '../send-message';

export function makeSendMessageUseCase() {
  const conversationsRepository = new PrismaAiConversationsRepository();
  const messagesRepository = new PrismaAiMessagesRepository();
  const configRepository = new PrismaAiTenantConfigRepository();
  const aiRouter = makeAiRouter();
  const toolRegistry = makeToolRegistry();
  const toolFactory = new ToolUseCaseFactory();
  const toolExecutor = new ToolExecutor(toolRegistry, toolFactory);
  const knowledgeRegistry = makeKnowledgeRegistry();
  return new SendMessageUseCase(
    conversationsRepository,
    messagesRepository,
    configRepository,
    aiRouter,
    toolRegistry,
    toolExecutor,
    knowledgeRegistry,
  );
}
