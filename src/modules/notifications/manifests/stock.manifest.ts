import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
  type ModuleNotificationManifest,
} from '../public/index.js';

const I = NotificationType.INFORMATIONAL;
const L = NotificationType.LINK;
const A = NotificationType.ACTIONABLE;
const P = NotificationType.PROGRESS;
const IA = NotificationChannel.IN_APP;
const EM = NotificationChannel.EMAIL;

export const stockManifest: ModuleNotificationManifest = {
  module: 'stock',
  displayName: 'Estoque',
  icon: 'Package',
  order: 40,
  categories: [
    // Inventory
    {
      code: 'stock.low_stock',
      name: 'Estoque baixo',
      description: 'Produto atingiu nível mínimo.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
      digestSupported: true,
    },
    {
      code: 'stock.out_of_stock',
      name: 'Sem estoque',
      description: 'Produto zerado.',
      defaultType: L,
      defaultPriority: NotificationPriority.URGENT,
      defaultChannels: [IA, EM],
    },
    {
      code: 'stock.expiring_7d',
      name: 'Vence em 7 dias',
      description: 'Itens próximos do vencimento.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'stock.expiring_30d',
      name: 'Vence em 30 dias',
      description: 'Itens com validade em 30 dias.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
      digestSupported: true,
    },
    {
      code: 'stock.expired',
      name: 'Itens vencidos',
      description: 'Itens passaram da validade.',
      defaultType: L,
      defaultPriority: NotificationPriority.URGENT,
      defaultChannels: [IA, EM],
    },
    {
      code: 'stock.reorder_point',
      name: 'Ponto de reposição',
      description: 'Criar pedido de compra sugerido.',
      defaultType: A,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },

    // Purchase orders
    {
      code: 'stock.po_created',
      name: 'Pedido de compra criado',
      description: 'Novo PO gerado.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'stock.po_confirmed',
      name: 'PO confirmado pelo fornecedor',
      description: 'Fornecedor confirmou o pedido.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'stock.po_partial_received',
      name: 'PO parcialmente recebido',
      description: 'Parte do pedido chegou.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'stock.po_received',
      name: 'PO totalmente recebido',
      description: 'Pedido completo recebido.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'stock.po_cancelled',
      name: 'PO cancelado',
      description: 'Pedido de compra foi cancelado.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },

    // Inventory counts
    {
      code: 'stock.inventory_variance',
      name: 'Divergência na contagem',
      description: 'Contagem com variação acima do tolerável.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'stock.inventory_session_completed',
      name: 'Contagem concluída',
      description: 'Sessão de inventário finalizada.',
      defaultType: I,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },

    // Transfers
    {
      code: 'stock.transfer_requested',
      name: 'Transferência solicitada',
      description: 'Pedido de transferência entre armazéns.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'stock.transfer_in_transit',
      name: 'Transferência em trânsito',
      description: 'Itens saíram da origem.',
      defaultType: I,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'stock.transfer_received',
      name: 'Transferência recebida',
      description: 'Itens chegaram ao destino.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },

    // Pricing
    {
      code: 'stock.price_changed_manual',
      name: 'Preço alterado manualmente',
      description: 'Usuário alterou preço.',
      defaultType: I,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },

    // Labels
    {
      code: 'stock.label_print_completed',
      name: 'Impressão de etiqueta concluída',
      description: 'Job de etiquetas finalizado.',
      defaultType: I,
      defaultPriority: NotificationPriority.LOW,
      defaultChannels: [IA],
    },
    {
      code: 'stock.label_print_failed',
      name: 'Falha na impressão',
      description: 'Erro ao imprimir etiqueta.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },

    // Import batches
    {
      code: 'stock.import_progress',
      name: 'Importação em progresso',
      description: 'Acompanhe o progresso da importação.',
      defaultType: P,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
      digestSupported: false,
    },
    {
      code: 'stock.import_completed',
      name: 'Importação concluída',
      description: 'Importação finalizada com sucesso.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'stock.import_errors',
      name: 'Importação com erros',
      description: 'Importação concluída mas com falhas.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },

    // Item status
    {
      code: 'stock.item_damaged',
      name: 'Item marcado como danificado',
      description: 'Status crítico alterado.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },
  ],
};
