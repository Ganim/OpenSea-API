import { PrismaChatbotConfigsRepository } from '@/repositories/sales/prisma/prisma-chatbot-configs-repository';
import { UpdateChatbotConfigUseCase } from '../update-chatbot-config';

export function makeUpdateChatbotConfigUseCase() {
  const chatbotConfigsRepository = new PrismaChatbotConfigsRepository();
  return new UpdateChatbotConfigUseCase(chatbotConfigsRepository);
}
