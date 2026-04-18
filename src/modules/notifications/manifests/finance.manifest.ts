import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
  type ModuleNotificationManifest,
} from '../public/index.js';

const I = NotificationType.INFORMATIONAL;
const L = NotificationType.LINK;
const AP = NotificationType.APPROVAL;
const IA = NotificationChannel.IN_APP;
const EM = NotificationChannel.EMAIL;

export const financeManifest: ModuleNotificationManifest = {
  module: 'finance',
  displayName: 'Financeiro',
  icon: 'DollarSign',
  order: 60,
  categories: [
    // Entries
    {
      code: 'finance.entry_created',
      name: 'Lançamento criado',
      description: 'Novo lançamento (pagar/receber).',
      defaultType: I,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'finance.entry_due_7d',
      name: 'Lançamento vence em 7 dias',
      description: 'Pagar/receber próximo do vencimento.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
      digestSupported: true,
    },
    {
      code: 'finance.entry_due_3d',
      name: 'Lançamento vence em 3 dias',
      description: 'Vencimento em 3 dias.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'finance.entry_due_today',
      name: 'Lançamento vence hoje',
      description: 'Vencimento hoje.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'finance.entry_overdue',
      name: 'Lançamento em atraso',
      description: 'Conta vencida em aberto.',
      defaultType: L,
      defaultPriority: NotificationPriority.URGENT,
      defaultChannels: [IA, EM],
    },
    {
      code: 'finance.entry_paid',
      name: 'Pagamento realizado',
      description: 'Lançamento quitado.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'finance.entry_partially_paid',
      name: 'Pagamento parcial',
      description: 'Lançamento parcialmente pago.',
      defaultType: I,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'finance.entry_approved',
      name: 'Lançamento aprovado',
      description: 'Aprovação de lançamento concluída.',
      defaultType: I,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'finance.entry_rejected',
      name: 'Lançamento rejeitado',
      description: 'Aprovação negada.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'finance.entry_approval_required',
      name: 'Aprovação requerida',
      description: 'Lançamento acima do limite precisa aprovar.',
      defaultType: AP,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },

    // Bank / reconciliation
    {
      code: 'finance.bank_sync_completed',
      name: 'Sincronização bancária concluída',
      description: 'Extrato bancário atualizado.',
      defaultType: I,
      defaultPriority: NotificationPriority.LOW,
      defaultChannels: [IA],
    },
    {
      code: 'finance.reconciliation_matched',
      name: 'Conciliação bem-sucedida',
      description: 'Transação conciliada.',
      defaultType: I,
      defaultPriority: NotificationPriority.LOW,
      defaultChannels: [IA],
    },
    {
      code: 'finance.reconciliation_discrepancy',
      name: 'Discrepância na conciliação',
      description: 'Divergência detectada na conciliação.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },

    // Period close
    {
      code: 'finance.period_close_started',
      name: 'Fechamento mensal iniciado',
      description: 'Processo de fechamento em andamento.',
      defaultType: I,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'finance.daily_summary',
      name: 'Resumo financeiro diário',
      description: 'Resumo do dia com saldo e movimentações.',
      defaultType: L,
      defaultPriority: NotificationPriority.LOW,
      defaultChannels: [EM],
      digestSupported: false,
    },

    // Loans / consortia
    {
      code: 'finance.loan_installment_due',
      name: 'Parcela de empréstimo a vencer',
      description: 'Próxima parcela do empréstimo.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'finance.loan_installment_overdue',
      name: 'Parcela de empréstimo em atraso',
      description: 'Parcela vencida.',
      defaultType: L,
      defaultPriority: NotificationPriority.URGENT,
      defaultChannels: [IA, EM],
    },
    {
      code: 'finance.loan_paid_off',
      name: 'Empréstimo quitado',
      description: 'Empréstimo finalizado.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'finance.consortium_drawn',
      name: 'Contemplação de consórcio',
      description: 'Consórcio contemplado.',
      defaultType: L,
      defaultPriority: NotificationPriority.URGENT,
      defaultChannels: [IA, EM],
    },
    {
      code: 'finance.consortium_payment_due',
      name: 'Parcela de consórcio a vencer',
      description: 'Próxima parcela do consórcio.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },

    // Cost center / cashflow
    {
      code: 'finance.cost_center_exceeded',
      name: 'Orçamento do centro de custo excedido',
      description: 'Limite do centro de custo ultrapassado.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'finance.cashflow_negative',
      name: 'Projeção de fluxo negativa',
      description: 'Projeção aponta saldo negativo.',
      defaultType: L,
      defaultPriority: NotificationPriority.URGENT,
      defaultChannels: [IA, EM],
    },

    // Invoices
    {
      code: 'finance.invoice_issued',
      name: 'Nota fiscal emitida',
      description: 'NFe emitida com sucesso.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'finance.invoice_rejected',
      name: 'Nota fiscal rejeitada',
      description: 'NFe rejeitada pela SEFAZ.',
      defaultType: L,
      defaultPriority: NotificationPriority.URGENT,
      defaultChannels: [IA, EM],
      mandatory: true,
    },

    // Payment methods
    {
      code: 'finance.pix_charge_created',
      name: 'Cobrança PIX criada',
      description: 'Nova cobrança via PIX.',
      defaultType: I,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'finance.boleto_created',
      name: 'Boleto emitido',
      description: 'Novo boleto disponível.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
    },
  ],
};
