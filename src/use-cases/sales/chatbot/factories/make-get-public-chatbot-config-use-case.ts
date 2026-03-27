import { PrismaChatbotConfigsRepository } from '@/repositories/sales/prisma/prisma-chatbot-configs-repository';
import { GetPublicChatbotConfigUseCase } from '../get-public-chatbot-config';

export function makeGetPublicChatbotConfigUseCase() {
  const chatbotConfigsRepository = new PrismaChatbotConfigsRepository();
  return new GetPublicChatbotConfigUseCase(chatbotConfigsRepository);
}
