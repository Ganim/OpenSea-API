import { PrismaChatbotConfigsRepository } from '@/repositories/sales/prisma/prisma-chatbot-configs-repository';
import { GetChatbotConfigUseCase } from '../get-chatbot-config';

export function makeGetChatbotConfigUseCase() {
  const chatbotConfigsRepository = new PrismaChatbotConfigsRepository();
  return new GetChatbotConfigUseCase(chatbotConfigsRepository);
}
