import type { MessagingGateway } from './messaging-gateway.interface';
import { InstagramGateway } from './instagram-gateway';
import { TelegramGateway } from './telegram-gateway';
import { WhatsAppGateway } from './whatsapp-gateway';

export function makeMessagingGateway(channel: string): MessagingGateway {
  switch (channel) {
    case 'WHATSAPP':
      return new WhatsAppGateway();
    case 'INSTAGRAM':
      return new InstagramGateway();
    case 'TELEGRAM':
      return new TelegramGateway();
    default:
      throw new Error(`Unsupported messaging channel: ${channel}`);
  }
}
