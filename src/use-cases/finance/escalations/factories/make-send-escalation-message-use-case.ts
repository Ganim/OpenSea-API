import { PrismaOverdueActionsRepository } from '@/repositories/finance/prisma/prisma-overdue-actions-repository';
import { PrismaMessagingAccountsRepository } from '@/repositories/messaging/prisma/prisma-messaging-accounts-repository';
import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { PrismaNotificationsRepository } from '@/repositories/notifications/prisma/prisma-notifications-repository';
import { WhatsAppGateway } from '@/services/messaging/whatsapp-gateway';
import { SmtpClientService } from '@/services/email/smtp-client.service';
import { SendEscalationMessageUseCase } from '../send-escalation-message';

export function makeSendEscalationMessageUseCase() {
  const actionsRepository = new PrismaOverdueActionsRepository();
  const messagingAccountsRepository =
    new PrismaMessagingAccountsRepository();
  const emailAccountsRepository = new PrismaEmailAccountsRepository();
  const customersRepository = new PrismaCustomersRepository();
  const notificationsRepository = new PrismaNotificationsRepository();
  const whatsappGateway = new WhatsAppGateway();
  const smtpClient = new SmtpClientService();

  return new SendEscalationMessageUseCase(
    actionsRepository,
    messagingAccountsRepository,
    emailAccountsRepository,
    customersRepository,
    notificationsRepository,
    whatsappGateway,
    smtpClient,
  );
}
