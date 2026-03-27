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
  // PROCESS BLUEPRINTS - Regras de Processo
  // ============================================================================

  /** Blueprint de processo criado */
  BLUEPRINT_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PROCESS_BLUEPRINT,
    module: AuditModule.SALES,
    description: "Blueprint '{{blueprintName}}' criado por {{userName}}",
  } satisfies AuditMessage,

  /** Blueprint de processo atualizado */
  BLUEPRINT_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PROCESS_BLUEPRINT,
    module: AuditModule.SALES,
    description: "Blueprint '{{blueprintName}}' atualizado por {{userName}}",
  } satisfies AuditMessage,

  /** Blueprint de processo excluído */
  BLUEPRINT_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.PROCESS_BLUEPRINT,
    module: AuditModule.SALES,
    description: "Blueprint '{{blueprintName}}' excluído por {{userName}}",
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

  PRICE_TABLE_BULK_IMPORT: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PRICE_TABLE,
    module: AuditModule.SALES,
    description:
      "{{count}} itens importados na tabela '{{tableName}}' por {{userName}}",
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

  COUPON_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.COUPON,
    module: AuditModule.SALES,
    description: "Cupom '{{couponCode}}' atualizado por {{userName}}",
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

  COMBO_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.COMBO,
    module: AuditModule.SALES,
    description: "Combo '{{comboName}}' atualizado por {{userName}}",
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

  // ============================================================================
  // STORE CREDITS - Créditos de Loja
  // ============================================================================

  // ============================================================================
  // QUOTES - Orçamentos
  // ============================================================================

  /** Orçamento criado */
  QUOTE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.QUOTE,
    module: AuditModule.SALES,
    description: "Orçamento '{{quoteTitle}}' criado por {{userName}}",
  } satisfies AuditMessage,

  /** Orçamento atualizado */
  QUOTE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.QUOTE,
    module: AuditModule.SALES,
    description: "Orçamento '{{quoteTitle}}' atualizado por {{userName}}",
  } satisfies AuditMessage,

  /** Orçamento excluído */
  QUOTE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.QUOTE,
    module: AuditModule.SALES,
    description: "Orçamento '{{quoteTitle}}' excluído por {{userName}}",
  } satisfies AuditMessage,

  /** Orçamento enviado */
  QUOTE_SEND: {
    action: AuditAction.STATUS_CHANGE,
    entity: AuditEntity.QUOTE,
    module: AuditModule.SALES,
    description: "Orçamento '{{quoteTitle}}' enviado por {{userName}}",
  } satisfies AuditMessage,

  /** Orçamento convertido em pedido */
  QUOTE_CONVERT: {
    action: AuditAction.ORDER_CONVERT_QUOTE,
    entity: AuditEntity.QUOTE,
    module: AuditModule.SALES,
    description:
      "Orçamento '{{quoteTitle}}' convertido em pedido por {{userName}}",
  } satisfies AuditMessage,

  /** Orçamento duplicado */
  QUOTE_DUPLICATE: {
    action: AuditAction.DUPLICATE,
    entity: AuditEntity.QUOTE,
    module: AuditModule.SALES,
    description: "Orçamento '{{quoteTitle}}' duplicado por {{userName}}",
  } satisfies AuditMessage,

  // ============================================================================
  // CADENCE SEQUENCES - Sequências de Cadência
  // ============================================================================

  /** Cadência criada */
  CADENCE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.CADENCE_SEQUENCE,
    module: AuditModule.SALES,
    description: "Cadência '{{cadenceName}}' criada por {{userName}}",
  } satisfies AuditMessage,

  /** Cadência atualizada */
  CADENCE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.CADENCE_SEQUENCE,
    module: AuditModule.SALES,
    description: "Cadência '{{cadenceName}}' atualizada por {{userName}}",
  } satisfies AuditMessage,

  /** Cadência excluída */
  CADENCE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.CADENCE_SEQUENCE,
    module: AuditModule.SALES,
    description: "Cadência '{{cadenceName}}' excluída por {{userName}}",
  } satisfies AuditMessage,

  /** Cadência ativada */
  CADENCE_ACTIVATE: {
    action: AuditAction.ACTIVATE,
    entity: AuditEntity.CADENCE_SEQUENCE,
    module: AuditModule.SALES,
    description: "Cadência '{{cadenceName}}' ativada por {{userName}}",
  } satisfies AuditMessage,

  /** Cadência desativada */
  CADENCE_DEACTIVATE: {
    action: AuditAction.DEACTIVATE,
    entity: AuditEntity.CADENCE_SEQUENCE,
    module: AuditModule.SALES,
    description: "Cadência '{{cadenceName}}' desativada por {{userName}}",
  } satisfies AuditMessage,

  /** Contato inscrito em cadência */
  CADENCE_ENROLL: {
    action: AuditAction.ENROLL,
    entity: AuditEntity.CADENCE_ENROLLMENT,
    module: AuditModule.SALES,
    description:
      "Contato inscrito na cadência '{{cadenceName}}' por {{userName}}",
  } satisfies AuditMessage,

  /** Passo da cadência avançado */
  CADENCE_ADVANCE_STEP: {
    action: AuditAction.ADVANCE_STEP,
    entity: AuditEntity.CADENCE_ENROLLMENT,
    module: AuditModule.SALES,
    description:
      "Passo {{stepOrder}} da cadência '{{cadenceName}}' avançado por {{userName}}",
  } satisfies AuditMessage,

  /** Ações pendentes processadas */
  CADENCE_PROCESS_PENDING: {
    action: AuditAction.PROCESS_PENDING,
    entity: AuditEntity.CADENCE_ENROLLMENT,
    module: AuditModule.SALES,
    description:
      '{{processedCount}} ações pendentes de cadência processadas por {{userName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // PROPOSALS - Propostas Comerciais
  // ============================================================================

  /** Proposta criada */
  PROPOSAL_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PROPOSAL,
    module: AuditModule.SALES,
    description: "Proposta '{{proposalTitle}}' criada por {{userName}}",
  } satisfies AuditMessage,

  /** Proposta atualizada */
  PROPOSAL_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PROPOSAL,
    module: AuditModule.SALES,
    description: "Proposta '{{proposalTitle}}' atualizada por {{userName}}",
  } satisfies AuditMessage,

  /** Proposta excluída */
  PROPOSAL_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.PROPOSAL,
    module: AuditModule.SALES,
    description: "Proposta '{{proposalTitle}}' excluída por {{userName}}",
  } satisfies AuditMessage,

  /** Proposta enviada */
  PROPOSAL_SEND: {
    action: AuditAction.STATUS_CHANGE,
    entity: AuditEntity.PROPOSAL,
    module: AuditModule.SALES,
    description: "Proposta '{{proposalTitle}}' enviada por {{userName}}",
  } satisfies AuditMessage,

  /** Proposta aprovada */
  PROPOSAL_APPROVE: {
    action: AuditAction.STATUS_CHANGE,
    entity: AuditEntity.PROPOSAL,
    module: AuditModule.SALES,
    description: "Proposta '{{proposalTitle}}' aprovada por {{userName}}",
  } satisfies AuditMessage,

  /** Proposta rejeitada */
  PROPOSAL_REJECT: {
    action: AuditAction.STATUS_CHANGE,
    entity: AuditEntity.PROPOSAL,
    module: AuditModule.SALES,
    description: "Proposta '{{proposalTitle}}' rejeitada por {{userName}}",
  } satisfies AuditMessage,

  /** Proposta duplicada */
  PROPOSAL_DUPLICATE: {
    action: AuditAction.DUPLICATE,
    entity: AuditEntity.PROPOSAL,
    module: AuditModule.SALES,
    description: "Proposta '{{proposalTitle}}' duplicada por {{userName}}",
  } satisfies AuditMessage,

  // ============================================================================
  // DISCOUNT RULES - Regras de Desconto
  // ============================================================================

  DISCOUNT_RULE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.DISCOUNT_RULE,
    module: AuditModule.SALES,
    description: "Regra de desconto '{{ruleName}}' criada por {{userName}}",
  } satisfies AuditMessage,

  DISCOUNT_RULE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.DISCOUNT_RULE,
    module: AuditModule.SALES,
    description: "Regra de desconto '{{ruleName}}' atualizada por {{userName}}",
  } satisfies AuditMessage,

  DISCOUNT_RULE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.DISCOUNT_RULE,
    module: AuditModule.SALES,
    description: "Regra de desconto '{{ruleName}}' excluída por {{userName}}",
  } satisfies AuditMessage,

  DISCOUNT_VALIDATE: {
    action: AuditAction.VALIDATE,
    entity: AuditEntity.DISCOUNT_RULE,
    module: AuditModule.SALES,
    description:
      '{{userName}} validou descontos para carrinho com {{itemCount}} itens',
  } satisfies AuditMessage,

  // ============================================================================
  // WORKFLOWS - Automações
  // ============================================================================

  WORKFLOW_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.WORKFLOW,
    module: AuditModule.SALES,
    description: "Workflow '{{workflowName}}' criado por {{userName}}",
  } satisfies AuditMessage,

  WORKFLOW_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.WORKFLOW,
    module: AuditModule.SALES,
    description: "Workflow '{{workflowName}}' atualizado por {{userName}}",
  } satisfies AuditMessage,

  WORKFLOW_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.WORKFLOW,
    module: AuditModule.SALES,
    description: "Workflow '{{workflowName}}' excluído por {{userName}}",
  } satisfies AuditMessage,

  WORKFLOW_ACTIVATE: {
    action: AuditAction.ACTIVATE,
    entity: AuditEntity.WORKFLOW,
    module: AuditModule.SALES,
    description: "Workflow '{{workflowName}}' ativado por {{userName}}",
  } satisfies AuditMessage,

  WORKFLOW_DEACTIVATE: {
    action: AuditAction.DEACTIVATE,
    entity: AuditEntity.WORKFLOW,
    module: AuditModule.SALES,
    description: "Workflow '{{workflowName}}' desativado por {{userName}}",
  } satisfies AuditMessage,

  WORKFLOW_EXECUTE: {
    action: AuditAction.EXECUTE,
    entity: AuditEntity.WORKFLOW,
    module: AuditModule.SALES,
    description:
      "Workflow '{{workflowName}}' executado por {{userName}} (trigger: {{trigger}})",
  } satisfies AuditMessage,

  // ============================================================================
  // MESSAGE TEMPLATES - Templates de Mensagem
  // ============================================================================

  MESSAGE_TEMPLATE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.MESSAGE_TEMPLATE,
    module: AuditModule.SALES,
    description: "Template '{{templateName}}' criado por {{userName}}",
  } satisfies AuditMessage,

  MESSAGE_TEMPLATE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.MESSAGE_TEMPLATE,
    module: AuditModule.SALES,
    description: "Template '{{templateName}}' atualizado por {{userName}}",
  } satisfies AuditMessage,

  MESSAGE_TEMPLATE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.MESSAGE_TEMPLATE,
    module: AuditModule.SALES,
    description: "Template '{{templateName}}' excluído por {{userName}}",
  } satisfies AuditMessage,

  MESSAGE_TEMPLATE_DUPLICATE: {
    action: AuditAction.DUPLICATE,
    entity: AuditEntity.MESSAGE_TEMPLATE,
    module: AuditModule.SALES,
    description: "Template '{{templateName}}' duplicado por {{userName}}",
  } satisfies AuditMessage,

  MESSAGE_TEMPLATE_PREVIEW: {
    action: AuditAction.PREVIEW,
    entity: AuditEntity.MESSAGE_TEMPLATE,
    module: AuditModule.SALES,
    description: "Template '{{templateName}}' pré-visualizado por {{userName}}",
  } satisfies AuditMessage,

  // ============================================================================
  // STORE CREDITS - Créditos de Loja
  // ============================================================================

  /** Crédito de loja excluído */
  STORE_CREDIT_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.STORE_CREDIT,
    module: AuditModule.SALES,
    description:
      '{{userName}} excluiu crédito de loja de R${{amount}} do cliente {{customerName}}',
  } satisfies AuditMessage,
  // ============================================================================
  // CONVERSATIONS - Conversas CRM
  // ============================================================================

  CONVERSATION_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.CONVERSATION,
    module: AuditModule.SALES,
    description: "{{userName}} criou conversa '{{conversationSubject}}'",
  } satisfies AuditMessage,

  CONVERSATION_CLOSE: {
    action: AuditAction.CONVERSATION_CLOSE,
    entity: AuditEntity.CONVERSATION,
    module: AuditModule.SALES,
    description: "{{userName}} fechou conversa '{{conversationSubject}}'",
  } satisfies AuditMessage,

  CONVERSATION_ARCHIVE: {
    action: AuditAction.CONVERSATION_ARCHIVE,
    entity: AuditEntity.CONVERSATION,
    module: AuditModule.SALES,
    description: "{{userName}} arquivou conversa '{{conversationSubject}}'",
  } satisfies AuditMessage,

  CONVERSATION_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.CONVERSATION,
    module: AuditModule.SALES,
    description: '{{userName}} excluiu uma conversa',
  } satisfies AuditMessage,

  CONVERSATION_MESSAGE_SEND: {
    action: AuditAction.MESSAGE_SEND,
    entity: AuditEntity.CONVERSATION_MESSAGE,
    module: AuditModule.SALES,
    description: '{{userName}} enviou mensagem em conversa',
  } satisfies AuditMessage,

  // ============================================================================
  // FORMS - Formulários CRM
  // ============================================================================

  FORM_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.FORM,
    module: AuditModule.SALES,
    description: "{{userName}} criou formulário '{{formTitle}}'",
  } satisfies AuditMessage,

  FORM_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.FORM,
    module: AuditModule.SALES,
    description: "{{userName}} atualizou formulário '{{formTitle}}'",
  } satisfies AuditMessage,

  FORM_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.FORM,
    module: AuditModule.SALES,
    description: "{{userName}} excluiu formulário '{{formTitle}}'",
  } satisfies AuditMessage,

  FORM_PUBLISH: {
    action: AuditAction.FORM_PUBLISH,
    entity: AuditEntity.FORM,
    module: AuditModule.SALES,
    description: "{{userName}} publicou formulário '{{formTitle}}'",
  } satisfies AuditMessage,

  FORM_UNPUBLISH: {
    action: AuditAction.FORM_UNPUBLISH,
    entity: AuditEntity.FORM,
    module: AuditModule.SALES,
    description: "{{userName}} despublicou formulário '{{formTitle}}'",
  } satisfies AuditMessage,

  FORM_DUPLICATE: {
    action: AuditAction.DUPLICATE,
    entity: AuditEntity.FORM,
    module: AuditModule.SALES,
    description: "{{userName}} duplicou formulário '{{formTitle}}'",
  } satisfies AuditMessage,

  FORM_SUBMISSION_CREATE: {
    action: AuditAction.FORM_SUBMIT,
    entity: AuditEntity.FORM_SUBMISSION,
    module: AuditModule.SALES,
    description: "Submissão recebida no formulário '{{formTitle}}'",
  } satisfies AuditMessage,

  // ============================================================================
  // LANDING PAGES - Páginas de captura
  // ============================================================================

  LANDING_PAGE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.LANDING_PAGE,
    module: AuditModule.SALES,
    description: "{{userName}} criou landing page '{{pageTitle}}'",
  } satisfies AuditMessage,

  LANDING_PAGE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.LANDING_PAGE,
    module: AuditModule.SALES,
    description: "{{userName}} atualizou landing page '{{pageTitle}}'",
  } satisfies AuditMessage,

  LANDING_PAGE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.LANDING_PAGE,
    module: AuditModule.SALES,
    description: "{{userName}} excluiu landing page '{{pageTitle}}'",
  } satisfies AuditMessage,

  LANDING_PAGE_PUBLISH: {
    action: AuditAction.STATUS_CHANGE,
    entity: AuditEntity.LANDING_PAGE,
    module: AuditModule.SALES,
    description: "{{userName}} publicou landing page '{{pageTitle}}'",
  } satisfies AuditMessage,

  LANDING_PAGE_UNPUBLISH: {
    action: AuditAction.STATUS_CHANGE,
    entity: AuditEntity.LANDING_PAGE,
    module: AuditModule.SALES,
    description: "{{userName}} despublicou landing page '{{pageTitle}}'",
  } satisfies AuditMessage,

  // ============================================================================
  // CASHIER - Caixa
  // ============================================================================

  CASHIER_SESSION_OPEN: {
    action: AuditAction.CASHIER_OPEN,
    entity: AuditEntity.CASHIER_SESSION,
    module: AuditModule.SALES,
    description: '{{userName}} abriu sessão de caixa',
  } satisfies AuditMessage,

  CASHIER_SESSION_CLOSE: {
    action: AuditAction.CASHIER_CLOSE,
    entity: AuditEntity.CASHIER_SESSION,
    module: AuditModule.SALES,
    description: '{{userName}} fechou sessão de caixa',
  } satisfies AuditMessage,

  CASHIER_SESSION_RECONCILE: {
    action: AuditAction.CASHIER_RECONCILE,
    entity: AuditEntity.CASHIER_SESSION,
    module: AuditModule.SALES,
    description: '{{userName}} reconciliou sessão de caixa',
  } satisfies AuditMessage,

  CASHIER_TRANSACTION_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.CASHIER_TRANSACTION,
    module: AuditModule.SALES,
    description: '{{userName}} registrou transação no caixa',
  } satisfies AuditMessage,

  CASHIER_CASH_MOVEMENT: {
    action: AuditAction.CASH_MOVEMENT,
    entity: AuditEntity.CASHIER_TRANSACTION,
    module: AuditModule.SALES,
    description:
      '{{userName}} registrou movimentação de caixa ({{movementType}})',
  } satisfies AuditMessage,

  // ============================================================================
  // LEAD SCORING - Pontuação de Leads
  // ============================================================================

  LEAD_SCORING_RULE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.LEAD_SCORING_RULE,
    module: AuditModule.SALES,
    description: "Regra de scoring '{{ruleName}}' criada por {{userName}}",
  } satisfies AuditMessage,

  LEAD_SCORING_RULE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.LEAD_SCORING_RULE,
    module: AuditModule.SALES,
    description: "Regra de scoring '{{ruleName}}' atualizada por {{userName}}",
  } satisfies AuditMessage,

  LEAD_SCORING_RULE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.LEAD_SCORING_RULE,
    module: AuditModule.SALES,
    description: "Regra de scoring '{{ruleName}}' excluída por {{userName}}",
  } satisfies AuditMessage,

  LEAD_SCORE_CALCULATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.LEAD_SCORE,
    module: AuditModule.SALES,
    description:
      '{{userName}} calculou score do lead {{customerId}} — {{score}} ({{tier}})',
  } satisfies AuditMessage,

  LEAD_SCORE_BULK_RECALCULATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.LEAD_SCORE,
    module: AuditModule.SALES,
    description:
      '{{userName}} recalculou scores de {{processedCount}} clientes',
  } satisfies AuditMessage,

  // ============================================================================
  // LEAD ROUTING - Roteamento automático de leads
  // ============================================================================

  LEAD_ROUTING_RULE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.LEAD_ROUTING_RULE,
    module: AuditModule.SALES,
    description: "Regra de roteamento '{{ruleName}}' criada por {{userName}}",
  } satisfies AuditMessage,

  LEAD_ROUTING_RULE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.LEAD_ROUTING_RULE,
    module: AuditModule.SALES,
    description:
      "Regra de roteamento '{{ruleName}}' atualizada por {{userName}}",
  } satisfies AuditMessage,

  LEAD_ROUTING_RULE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.LEAD_ROUTING_RULE,
    module: AuditModule.SALES,
    description: "Regra de roteamento '{{ruleName}}' excluída por {{userName}}",
  } satisfies AuditMessage,

  LEAD_ROUTING_EXECUTED: {
    action: AuditAction.CREATE,
    entity: AuditEntity.LEAD_ROUTING_RULE,
    module: AuditModule.SALES,
    description:
      "Lead do cliente '{{customerName}}' roteado para {{assignedUser}} via regra '{{ruleName}}' ({{strategy}})",
  } satisfies AuditMessage,

  // ============================================================================
  // INTEGRATIONS - Marketplace Hub
  // ============================================================================

  /** Integration connected */
  INTEGRATION_CONNECT: {
    action: AuditAction.CREATE,
    entity: AuditEntity.TENANT_INTEGRATION,
    module: AuditModule.SALES,
    description: '{{userName}} conectou a integração {{integrationName}}',
  } satisfies AuditMessage,

  /** Integration disconnected */
  INTEGRATION_DISCONNECT: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.TENANT_INTEGRATION,
    module: AuditModule.SALES,
    description: '{{userName}} desconectou a integração {{integrationName}}',
  } satisfies AuditMessage,

  /** Integration config updated */
  INTEGRATION_CONFIG_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.TENANT_INTEGRATION,
    module: AuditModule.SALES,
    description:
      '{{userName}} atualizou a configuração da integração {{integrationName}}',
  } satisfies AuditMessage,

  /** Integration synced */
  INTEGRATION_SYNC: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.TENANT_INTEGRATION,
    module: AuditModule.SALES,
    description: '{{userName}} sincronizou a integração {{integrationName}}',
  } satisfies AuditMessage,
} as const;

export type SalesAuditMessageKey = keyof typeof SALES_AUDIT_MESSAGES;
