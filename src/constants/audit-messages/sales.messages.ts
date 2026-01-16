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
} as const;

export type SalesAuditMessageKey = keyof typeof SALES_AUDIT_MESSAGES;
