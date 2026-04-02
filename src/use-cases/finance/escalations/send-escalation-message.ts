import { logger } from '@/lib/logger';
import type { OverdueActionsRepository } from '@/repositories/finance/overdue-actions-repository';
import type { MessagingAccountsRepository } from '@/repositories/messaging/messaging-accounts-repository';
import type { EmailAccountsRepository } from '@/repositories/email/email-accounts-repository';
import type { CustomersRepository } from '@/repositories/sales/customers-repository';
import type { NotificationsRepository } from '@/repositories/notifications/notifications-repository';
import type { MessagingGateway } from '@/services/messaging/messaging-gateway.interface';
import type {
  SmtpClientService,
  SmtpConnectionConfig,
} from '@/services/email/smtp-client.service';
import type { OverdueAction } from '@/entities/finance/overdue-action';
import type { OverdueEscalationStep } from '@/entities/finance/overdue-escalation-step';
import type { FinanceEntry } from '@/entities/finance/finance-entry';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

// ============================================================================
// TYPES
// ============================================================================

interface SendEscalationMessageUseCaseRequest {
  tenantId: string;
  action: OverdueAction;
  step: OverdueEscalationStep;
  entry: FinanceEntry;
  createdBy?: string;
}

interface SendEscalationMessageUseCaseResponse {
  success: boolean;
  error?: string;
}

// ============================================================================
// USE CASE
// ============================================================================

export class SendEscalationMessageUseCase {
  constructor(
    private overdueActionsRepository: OverdueActionsRepository,
    private messagingAccountsRepository: MessagingAccountsRepository,
    private emailAccountsRepository: EmailAccountsRepository,
    private customersRepository: CustomersRepository,
    private notificationsRepository: NotificationsRepository,
    private whatsappGateway: MessagingGateway,
    private smtpClient: SmtpClientService,
  ) {}

  async execute(
    request: SendEscalationMessageUseCaseRequest,
  ): Promise<SendEscalationMessageUseCaseResponse> {
    const { tenantId, action, step, entry, createdBy } = request;

    try {
      // Render the message with placeholders
      const renderedMessage = this.renderTemplate(step.message, entry);
      const renderedSubject = step.subject
        ? this.renderTemplate(step.subject, entry)
        : `Cobrança: ${entry.code}`;

      switch (step.channel) {
        case 'WHATSAPP': {
          await this.sendWhatsApp(tenantId, entry, renderedMessage);
          break;
        }
        case 'EMAIL': {
          await this.sendEmail(
            tenantId,
            entry,
            renderedSubject,
            renderedMessage,
          );
          break;
        }
        case 'INTERNAL_NOTE': {
          await this.appendInternalNote(entry, renderedMessage);
          break;
        }
        case 'SYSTEM_ALERT': {
          await this.createSystemAlert(
            entry,
            renderedSubject,
            renderedMessage,
            createdBy,
          );
          break;
        }
      }

      // Mark action as SENT
      await this.overdueActionsRepository.updateStatus(action.id, 'SENT');

      logger.info(
        {
          tenantId,
          actionId: action.id.toString(),
          channel: step.channel,
          entryCode: entry.code,
        },
        '[send-escalation-message] message sent successfully',
      );

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      // Mark action as FAILED with error
      await this.overdueActionsRepository.updateStatus(
        action.id,
        'FAILED',
        errorMessage,
      );

      logger.error(
        {
          tenantId,
          actionId: action.id.toString(),
          channel: step.channel,
          entryCode: entry.code,
          error: err,
        },
        '[send-escalation-message] failed to send message',
      );

      return { success: false, error: errorMessage };
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // CHANNEL IMPLEMENTATIONS
  // ────────────────────────────────────────────────────────────────────────────

  private async sendWhatsApp(
    tenantId: string,
    entry: FinanceEntry,
    message: string,
  ): Promise<void> {
    // Find WhatsApp messaging account for this tenant
    const accounts =
      await this.messagingAccountsRepository.findByTenantAndChannel(
        tenantId,
        'WHATSAPP',
      );

    const activeAccount = accounts.find((a) => a.status === 'ACTIVE');
    if (!activeAccount) {
      throw new Error(
        'Nenhuma conta WhatsApp ativa encontrada para este tenant',
      );
    }

    // Resolve customer phone number
    const phone = await this.resolveCustomerPhone(entry);
    if (!phone) {
      throw new Error(
        `Número de telefone não encontrado para o cliente da entrada ${entry.code}`,
      );
    }

    // Extract instance name from settings or use account id
    const instanceName =
      ((activeAccount.settings as Record<string, unknown> | null)
        ?.instanceName as string | undefined) ?? activeAccount.id.toString();

    await this.whatsappGateway.sendMessage(instanceName, {
      to: phone,
      text: message,
    });
  }

  private async sendEmail(
    tenantId: string,
    entry: FinanceEntry,
    subject: string,
    message: string,
  ): Promise<void> {
    // Find an active email account for this tenant
    const emailAccounts =
      await this.emailAccountsRepository.listActive(tenantId);

    const account = emailAccounts.find((a) => a.isDefault) ?? emailAccounts[0];
    if (!account) {
      throw new Error(
        'Nenhuma conta de e-mail ativa encontrada para este tenant',
      );
    }

    // Resolve customer email
    const email = await this.resolveCustomerEmail(entry);
    if (!email) {
      throw new Error(
        `E-mail não encontrado para o cliente da entrada ${entry.code}`,
      );
    }

    const smtpConfig: SmtpConnectionConfig = {
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.smtpSecure,
      username: account.username,
      secret: account.encryptedSecret,
      rejectUnauthorized: account.tlsVerify,
    };

    // Wrap message in basic HTML
    const htmlBody = this.wrapEmailHtml(message, subject);

    await this.smtpClient.send(smtpConfig, {
      from: account.displayName
        ? `"${account.displayName}" <${account.address}>`
        : account.address,
      to: [email],
      subject,
      html: htmlBody,
    });
  }

  private async appendInternalNote(
    entry: FinanceEntry,
    message: string,
  ): Promise<void> {
    const timestamp = this.formatDateTime(new Date());
    const notePrefix = `[Cobrança automática — ${timestamp}]`;
    const currentNotes = entry.notes ?? '';
    const separator = currentNotes ? '\n\n' : '';

    entry.notes = `${currentNotes}${separator}${notePrefix}\n${message}`;

    logger.info(
      {
        entryId: entry.id.toString(),
        entryCode: entry.code,
      },
      '[send-escalation-message] internal note appended',
    );
  }

  private async createSystemAlert(
    entry: FinanceEntry,
    subject: string,
    message: string,
    createdBy?: string,
  ): Promise<void> {
    if (!createdBy) {
      logger.warn(
        { entryCode: entry.code },
        '[send-escalation-message] SYSTEM_ALERT skipped — no createdBy user',
      );
      return;
    }

    await this.notificationsRepository.create({
      userId: new UniqueEntityID(createdBy),
      title: subject,
      message,
      type: 'WARNING',
      priority: 'HIGH',
      channel: 'IN_APP',
      entityType: 'finance_entry',
      entityId: entry.id.toString(),
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────────────────────────────────

  private renderTemplate(template: string, entry: FinanceEntry): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(entry.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    const daysPastDue = Math.max(
      0,
      Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)),
    );

    return template
      .replace(/{customerName}/g, entry.customerName ?? 'Cliente')
      .replace(/{amount}/g, this.formatBRL(entry.expectedAmount))
      .replace(/{dueDate}/g, this.formatDate(entry.dueDate))
      .replace(/{daysPastDue}/g, String(daysPastDue))
      .replace(/{entryCode}/g, entry.code)
      .replace(/{description}/g, entry.description);
  }

  private formatBRL(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private formatDateTime(date: Date): string {
    return `${this.formatDate(date)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private async resolveCustomerPhone(
    entry: FinanceEntry,
  ): Promise<string | null> {
    if (!entry.customerId) return null;

    const customer = await this.customersRepository.findById(
      new UniqueEntityID(entry.customerId),
      entry.tenantId.toString(),
    );

    return customer?.phone ?? null;
  }

  private async resolveCustomerEmail(
    entry: FinanceEntry,
  ): Promise<string | null> {
    if (!entry.customerId) return null;

    const customer = await this.customersRepository.findById(
      new UniqueEntityID(entry.customerId),
      entry.tenantId.toString(),
    );

    return customer?.email ?? null;
  }

  private wrapEmailHtml(message: string, _subject: string): string {
    // Convert newlines to <br> for plain-text messages
    const htmlMessage = message.replace(/\n/g, '<br>');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto;">
    ${htmlMessage}
  </div>
</body>
</html>`;
  }
}
