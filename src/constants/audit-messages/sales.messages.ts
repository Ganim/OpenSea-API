import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import type { AuditMessage } from './types';

/**
 * Mensagens de auditoria do módulo SALES (Vendas)
 *
 * Inclui: Sales Orders, Customers, Comments, Item Reservations,
 * Variant Promotions, Notification Preferences
 */
export const SALES_AUDIT_MESSAGES = {
  // ============================================================================
  // SALES ORDERS - Pedidos de venda
  // ============================================================================

  /** Pedido de venda criado */
  ORDER_CREATE: {
    action: AuditAction.ORDER_CREATE,
    entity: AuditEntity.SALES_ORDER,
    module: AuditModule.SALES,
    description:
      '{{userName}} criou o pedido #{{orderNumber}} para {{customerName}}',
  } satisfies AuditMessage,

  /** Status do pedido alterado */
  ORDER_STATUS_CHANGE: {
    action: AuditAction.STATUS_CHANGE,
    entity: AuditEntity.SALES_ORDER,
    module: AuditModule.SALES,
    description:
      '{{userName}} alterou status do pedido #{{orderNumber}} de {{oldStatus}} para {{newStatus}}',
  } satisfies AuditMessage,

  /** Pedido cancelado */
  ORDER_CANCEL: {
    action: AuditAction.ORDER_CANCEL,
    entity: AuditEntity.SALES_ORDER,
    module: AuditModule.SALES,
    description: '{{userName}} cancelou o pedido #{{orderNumber}}',
  } satisfies AuditMessage,

  // ============================================================================
  // ORDERS (New Pipeline-based) - Pedidos
  // ============================================================================

  ORDER_NEW_CREATE: {
    action: AuditAction.ORDER_CREATE,
    entity: AuditEntity.ORDER,
    module: AuditModule.SALES,
    description:
      '{{userName}} criou o pedido #{{orderNumber}} para {{customerName}}',
  } satisfies AuditMessage,

  ORDER_NEW_CONFIRM: {
    action: AuditAction.ORDER_CONFIRM,
    entity: AuditEntity.ORDER,
    module: AuditModule.SALES,
    description: '{{userName}} confirmou o pedido #{{orderNumber}}',
  } satisfies AuditMessage,

  ORDER_NEW_CANCEL: {
    action: AuditAction.ORDER_CANCEL,
    entity: AuditEntity.ORDER,
    module: AuditModule.SALES,
    description: '{{userName}} cancelou o pedido #{{orderNumber}}',
  } satisfies AuditMessage,

  ORDER_STAGE_CHANGE: {
    action: AuditAction.ORDER_STAGE_CHANGE,
    entity: AuditEntity.ORDER,
    module: AuditModule.SALES,
    description:
      '{{userName}} moveu o pedido #{{orderNumber}} para etapa {{stageName}}',
  } satisfies AuditMessage,

  ORDER_CONVERT_QUOTE: {
    action: AuditAction.ORDER_CONVERT_QUOTE,
    entity: AuditEntity.ORDER,
    module: AuditModule.SALES,
    description: '{{userName}} converteu orçamento #{{orderNumber}} em pedido',
  } satisfies AuditMessage,

  RETURN_CREATE: {
    action: AuditAction.RETURN_CREATE,
    entity: AuditEntity.ORDER_RETURN,
    module: AuditModule.SALES,
    description:
      '{{userName}} criou devolução #{{returnNumber}} para pedido #{{orderNumber}}',
  } satisfies AuditMessage,

  RETURN_APPROVE: {
    action: AuditAction.RETURN_APPROVE,
    entity: AuditEntity.ORDER_RETURN,
    module: AuditModule.SALES,
    description: '{{userName}} aprovou devolução #{{returnNumber}}',
  } satisfies AuditMessage,

  // ============================================================================
  // CUSTOMERS - Clientes
  // ============================================================================

  /** Cliente criado */
  CUSTOMER_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.CUSTOMER,
    module: AuditModule.SALES,
    description: '{{userName}} cadastrou o cliente {{customerName}}',
  } satisfies AuditMessage,

  /** Cliente atualizado */
  CUSTOMER_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.CUSTOMER,
    module: AuditModule.SALES,
    description: '{{userName}} atualizou os dados de {{customerName}}',
  } satisfies AuditMessage,

  /** Cliente excluído */
  CUSTOMER_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.CUSTOMER,
    module: AuditModule.SALES,
    description: '{{userName}} excluiu o cliente {{customerName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // DEALS - Negócios (CRM)
  // ============================================================================

  /** Deal criado */
  DEAL_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.DEAL,
    module: AuditModule.SALES,
    description:
      "Deal '{{dealTitle}}' criado por {{userName}} no pipeline '{{pipelineName}}'",
  } satisfies AuditMessage,

  /** Deal atualizado */
  DEAL_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.DEAL,
    module: AuditModule.SALES,
    description: "Deal '{{dealTitle}}' atualizado por {{userName}}",
  } satisfies AuditMessage,

  /** Deal excluído */
  DEAL_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.DEAL,
    module: AuditModule.SALES,
    description: "Deal '{{dealTitle}}' excluído por {{userName}}",
  } satisfies AuditMessage,

  /** Deal mudou de estágio */
  DEAL_STAGE_CHANGE: {
    action: AuditAction.STAGE_CHANGE_DEAL,
    entity: AuditEntity.DEAL,
    module: AuditModule.SALES,
    description:
      "Deal '{{dealTitle}}' movido de '{{fromStage}}' para '{{toStage}}' por {{userName}}",
  } satisfies AuditMessage,

  // ============================================================================
  // ACTIVITIES - Atividades (CRM)
  // ============================================================================

  /** Atividade criada */
  ACTIVITY_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.ACTIVITY,
    module: AuditModule.SALES,
    description:
      "Atividade '{{activityTitle}}' ({{activityType}}) criada por {{userName}}",
  } satisfies AuditMessage,

  /** Atividade atualizada */
  ACTIVITY_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.ACTIVITY,
    module: AuditModule.SALES,
    description: "Atividade '{{activityTitle}}' atualizada por {{userName}}",
  } satisfies AuditMessage,

  /** Atividade excluída */
  ACTIVITY_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.ACTIVITY,
    module: AuditModule.SALES,
    description: "Atividade '{{activityTitle}}' excluída por {{userName}}",
  } satisfies AuditMessage,

  // ============================================================================
  // COMMENTS - Comentários em pedidos
  // ============================================================================

  /** Comentário criado */
  COMMENT_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.COMMENT,
    module: AuditModule.SALES,
    description: '{{userName}} adicionou comentário no pedido #{{orderNumber}}',
  } satisfies AuditMessage,

  /** Comentário atualizado */
  COMMENT_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.COMMENT,
    module: AuditModule.SALES,
    description: '{{userName}} editou comentário no pedido #{{orderNumber}}',
  } satisfies AuditMessage,

  /** Comentário excluído */
  COMMENT_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.COMMENT,
    module: AuditModule.SALES,
    description: '{{userName}} removeu comentário do pedido #{{orderNumber}}',
  } satisfies AuditMessage,

  // ============================================================================
  // ITEM RESERVATIONS - Reservas de itens
  // ============================================================================

  /** Reserva de item criada */
  ITEM_RESERVATION_CREATE: {
    action: AuditAction.RESERVATION_CREATE,
    entity: AuditEntity.ITEM_RESERVATION,
    module: AuditModule.SALES,
    description:
      '{{userName}} reservou {{quantity}} unidades de {{productName}} para pedido #{{orderNumber}}',
  } satisfies AuditMessage,

  /** Reserva de item liberada */
  ITEM_RESERVATION_RELEASE: {
    action: AuditAction.RESERVATION_RELEASE,
    entity: AuditEntity.ITEM_RESERVATION,
    module: AuditModule.SALES,
    description:
      '{{userName}} liberou reserva de {{quantity}} unidades de {{productName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // VARIANT PROMOTIONS - Promoções de variantes
  // ============================================================================

  /** Promoção criada */
  VARIANT_PROMOTION_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.VARIANT_PROMOTION,
    module: AuditModule.SALES,
    description:
      '{{userName}} criou promoção para {{variantName}}: {{discountPercent}}% de desconto',
  } satisfies AuditMessage,

  /** Promoção atualizada */
  VARIANT_PROMOTION_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.VARIANT_PROMOTION,
    module: AuditModule.SALES,
    description: '{{userName}} atualizou promoção de {{variantName}}',
  } satisfies AuditMessage,

  /** Promoção excluída */
  VARIANT_PROMOTION_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.VARIANT_PROMOTION,
    module: AuditModule.SALES,
    description: '{{userName}} removeu promoção de {{variantName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // NOTIFICATION PREFERENCES - Preferências de notificação
  // ============================================================================

  /** Preferência de notificação criada */
  NOTIFICATION_PREFERENCE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.NOTIFICATION_PREFERENCE,
    module: AuditModule.SALES,
    description: '{{userName}} configurou preferências de notificação',
  } satisfies AuditMessage,

  /** Preferência de notificação atualizada */
  NOTIFICATION_PREFERENCE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.NOTIFICATION_PREFERENCE,
    module: AuditModule.SALES,
    description: '{{userName}} atualizou preferências de notificação',
  } satisfies AuditMessage,

  /** Preferência de notificação excluída */
  NOTIFICATION_PREFERENCE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.NOTIFICATION_PREFERENCE,
    module: AuditModule.SALES,
    description: '{{userName}} removeu preferências de notificação',
  } satisfies AuditMessage,

  // ============================================================================
  // CONTACTS - Contatos CRM
  // ============================================================================

  /** Contato criado */
  CONTACT_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.CONTACT,
    module: AuditModule.SALES,
    description: "Contato '{{contactName}}' criado por {{userName}}",
  } satisfies AuditMessage,

  /** Contato atualizado */
  CONTACT_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.CONTACT,
    module: AuditModule.SALES,
    description: "Contato '{{contactName}}' atualizado por {{userName}}",
  } satisfies AuditMessage,

  /** Contato excluído */
  CONTACT_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.CONTACT,
    module: AuditModule.SALES,
    description: "Contato '{{contactName}}' excluído por {{userName}}",
  } satisfies AuditMessage,

  // ============================================================================
  // PIPELINES - Pipelines CRM
  // ============================================================================

  /** Pipeline criado */
  PIPELINE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PIPELINE,
    module: AuditModule.SALES,
    description: "Pipeline '{{pipelineName}}' criado por {{userName}}",
  } satisfies AuditMessage,

  /** Pipeline atualizado */
  PIPELINE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PIPELINE,
    module: AuditModule.SALES,
    description: "Pipeline '{{pipelineName}}' atualizado por {{userName}}",
  } satisfies AuditMessage,

  /** Pipeline excluído */
  PIPELINE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.PIPELINE,
    module: AuditModule.SALES,
    description: "Pipeline '{{pipelineName}}' excluído por {{userName}}",
  } satisfies AuditMessage,

  // ============================================================================
  // PIPELINE STAGES - Etapas do Pipeline
  // ============================================================================

  /** Etapa do pipeline criada */
  PIPELINE_STAGE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PIPELINE_STAGE,
    module: AuditModule.SALES,
    description: "Etapa '{{stageName}}' criada por {{userName}}",
  } satisfies AuditMessage,

  /** Etapa do pipeline atualizada */
  PIPELINE_STAGE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PIPELINE_STAGE,
    module: AuditModule.SALES,
    description: "Etapa '{{stageName}}' atualizada por {{userName}}",
  } satisfies AuditMessage,

  /** Etapa do pipeline excluída */
  PIPELINE_STAGE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.PIPELINE_STAGE,
    module: AuditModule.SALES,
    description: "Etapa '{{stageName}}' excluída por {{userName}}",
  } satisfies AuditMessage,

  /** Etapas do pipeline reordenadas */
  PIPELINE_STAGE_REORDER: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PIPELINE_STAGE,
    module: AuditModule.SALES,
    description: '{{userName}} reordenou as etapas do pipeline',
  } satisfies AuditMessage,

  // ============================================================================
  // PRICE TABLES - Tabelas de preço
  // ============================================================================

  PRICE_TABLE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PRICE_TABLE,
    module: AuditModule.SALES,
    description: "Tabela de preço '{{tableName}}' criada por {{userName}}",
  } satisfies AuditMessage,

  PRICE_TABLE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PRICE_TABLE,
    module: AuditModule.SALES,
    description: "Tabela de preço '{{tableName}}' atualizada por {{userName}}",
  } satisfies AuditMessage,

  PRICE_TABLE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.PRICE_TABLE,
    module: AuditModule.SALES,
    description: "Tabela de preço '{{tableName}}' excluída por {{userName}}",
  } satisfies AuditMessage,

  // ============================================================================
  // CUSTOMER PRICES - Preços por cliente
  // ============================================================================

  CUSTOMER_PRICE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.CUSTOMER_PRICE,
    module: AuditModule.SALES,
    description:
      'Preço especial criado por {{userName}} para cliente {{customerId}}',
  } satisfies AuditMessage,

  CUSTOMER_PRICE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.CUSTOMER_PRICE,
    module: AuditModule.SALES,
    description:
      'Preço especial atualizado por {{userName}} para cliente {{customerId}}',
  } satisfies AuditMessage,

  CUSTOMER_PRICE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.CUSTOMER_PRICE,
    module: AuditModule.SALES,
    description:
      'Preço especial excluído por {{userName}} para cliente {{customerId}}',
  } satisfies AuditMessage,

  // ============================================================================
  // CAMPAIGNS - Campanhas promocionais
  // ============================================================================

  CAMPAIGN_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.CAMPAIGN,
    module: AuditModule.SALES,
    description: "Campanha '{{campaignName}}' criada por {{userName}}",
  } satisfies AuditMessage,

  CAMPAIGN_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.CAMPAIGN,
    module: AuditModule.SALES,
    description: "Campanha '{{campaignName}}' atualizada por {{userName}}",
  } satisfies AuditMessage,

  CAMPAIGN_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.CAMPAIGN,
    module: AuditModule.SALES,
    description: "Campanha '{{campaignName}}' excluída por {{userName}}",
  } satisfies AuditMessage,

  CAMPAIGN_ACTIVATE: {
    action: AuditAction.STATUS_CHANGE,
    entity: AuditEntity.CAMPAIGN,
    module: AuditModule.SALES,
    description: "Campanha '{{campaignName}}' ativada por {{userName}}",
  } satisfies AuditMessage,

  // ============================================================================
  // COUPONS - Cupons de desconto
  // ============================================================================

  COUPON_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.COUPON,
    module: AuditModule.SALES,
    description: "Cupom '{{couponCode}}' criado por {{userName}}",
  } satisfies AuditMessage,

  COUPON_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.COUPON,
    module: AuditModule.SALES,
    description: "Cupom '{{couponCode}}' excluído por {{userName}}",
  } satisfies AuditMessage,

  // ============================================================================
  // COMBOS - Combos de produtos
  // ============================================================================

  COMBO_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.COMBO,
    module: AuditModule.SALES,
    description: "Combo '{{comboName}}' criado por {{userName}}",
  } satisfies AuditMessage,

  COMBO_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.COMBO,
    module: AuditModule.SALES,
    description: "Combo '{{comboName}}' excluído por {{userName}}",
  } satisfies AuditMessage,

  // ============================================================================
  // CATALOGS - Catálogos de produtos
  // ============================================================================

  CATALOG_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.CATALOG,
    module: AuditModule.SALES,
    description: "Catálogo '{{catalogName}}' criado por {{userName}}",
  } satisfies AuditMessage,

  CATALOG_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.CATALOG,
    module: AuditModule.SALES,
    description: "Catálogo '{{catalogName}}' atualizado por {{userName}}",
  } satisfies AuditMessage,

  CATALOG_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.CATALOG,
    module: AuditModule.SALES,
    description: "Catálogo '{{catalogName}}' excluído por {{userName}}",
  } satisfies AuditMessage,

  CATALOG_ITEM_ADD: {
    action: AuditAction.CREATE,
    entity: AuditEntity.CATALOG_ITEM,
    module: AuditModule.SALES,
    description: '{{userName}} adicionou item ao catálogo {{catalogName}}',
  } satisfies AuditMessage,

  CATALOG_ITEM_REMOVE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.CATALOG_ITEM,
    module: AuditModule.SALES,
    description: '{{userName}} removeu item do catálogo {{catalogName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // BRAND - Identidade visual
  // ============================================================================

  BRAND_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.TENANT_BRAND,
    module: AuditModule.SALES,
    description: '{{userName}} atualizou a identidade visual',
  } satisfies AuditMessage,

  // ============================================================================
  // GENERATED CONTENT - Conteúdo gerado
  // ============================================================================

  CONTENT_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.GENERATED_CONTENT,
    module: AuditModule.SALES,
    description: "Conteúdo '{{contentTitle}}' criado por {{userName}}",
  } satisfies AuditMessage,

  CONTENT_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.GENERATED_CONTENT,
    module: AuditModule.SALES,
    description: "Conteúdo '{{contentTitle}}' excluído por {{userName}}",
  } satisfies AuditMessage,

  CONTENT_APPROVE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.GENERATED_CONTENT,
    module: AuditModule.SALES,
    description: "Conteúdo '{{contentTitle}}' aprovado por {{userName}}",
  } satisfies AuditMessage,

  // ============================================================================
  // POS - Ponto de Venda
  // ============================================================================

  POS_TERMINAL_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.POS_TERMINAL,
    module: AuditModule.SALES,
    description: '{{userName}} criou o terminal PDV {{terminalName}}',
  } satisfies AuditMessage,

  POS_TERMINAL_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.POS_TERMINAL,
    module: AuditModule.SALES,
    description: '{{userName}} atualizou o terminal PDV {{terminalName}}',
  } satisfies AuditMessage,

  POS_TERMINAL_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.POS_TERMINAL,
    module: AuditModule.SALES,
    description: '{{userName}} excluiu o terminal PDV {{terminalId}}',
  } satisfies AuditMessage,

  POS_SESSION_OPEN: {
    action: AuditAction.CREATE,
    entity: AuditEntity.POS_SESSION,
    module: AuditModule.SALES,
    description: '{{userName}} abriu sessão do PDV',
  } satisfies AuditMessage,

  POS_SESSION_CLOSE: {
    action: AuditAction.STATUS_CHANGE,
    entity: AuditEntity.POS_SESSION,
    module: AuditModule.SALES,
    description: '{{userName}} fechou sessão do PDV',
  } satisfies AuditMessage,

  POS_TRANSACTION_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.POS_TRANSACTION,
    module: AuditModule.SALES,
    description: '{{userName}} criou transação PDV',
  } satisfies AuditMessage,

  POS_TRANSACTION_CANCEL: {
    action: AuditAction.CANCEL,
    entity: AuditEntity.POS_TRANSACTION,
    module: AuditModule.SALES,
    description: 'Transação PDV {{transactionId}} cancelada',
  } satisfies AuditMessage,

  POS_CASH_MOVEMENT: {
    action: AuditAction.CREATE,
    entity: AuditEntity.POS_CASH_MOVEMENT,
    module: AuditModule.SALES,
    description: '{{userName}} registrou movimentação de caixa',
  } satisfies AuditMessage,

  // ─── Bids (Licitacoes) ──────────────────────────────────────────────────

  BID_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.BID,
    module: AuditModule.SALES,
    description: "Licitacao '{{bidTitle}}' criada por {{userName}}",
  } satisfies AuditMessage,

  BID_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.BID,
    module: AuditModule.SALES,
    description: "Licitacao '{{bidTitle}}' atualizada por {{userName}}",
  } satisfies AuditMessage,

  BID_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.BID,
    module: AuditModule.SALES,
    description: "Licitacao '{{bidTitle}}' excluida por {{userName}}",
  } satisfies AuditMessage,

  BID_STATUS_CHANGE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.BID,
    module: AuditModule.SALES,
    description:
      "Status da licitacao '{{bidTitle}}' alterado para {{newStatus}} por {{userName}}",
  } satisfies AuditMessage,

  BID_DOCUMENT_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.BID_DOCUMENT,
    module: AuditModule.SALES,
    description:
      "Documento '{{documentName}}' adicionado a licitacao por {{userName}}",
  } satisfies AuditMessage,

  BID_CONTRACT_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.BID_CONTRACT,
    module: AuditModule.SALES,
    description: "Contrato '{{contractNumber}}' criado por {{userName}}",
  } satisfies AuditMessage,

  BID_EMPENHO_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.BID_EMPENHO,
    module: AuditModule.SALES,
    description: "Empenho '{{empenhoNumber}}' criado por {{userName}}",
  } satisfies AuditMessage,

  BID_AI_CONFIG_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.BID_AI_CONFIG,
    module: AuditModule.SALES,
    description:
      'Configuracao de IA para licitacoes atualizada por {{userName}}',
  } satisfies AuditMessage,
} as const;

export type SalesAuditMessageKey = keyof typeof SALES_AUDIT_MESSAGES;
