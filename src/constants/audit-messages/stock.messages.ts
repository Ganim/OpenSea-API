import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import type { AuditMessage } from './types';

/**
 * Mensagens de auditoria do módulo STOCK
 *
 * Inclui: Products, Categories, Variants, Items, Locations,
 * Manufacturers, Suppliers, Tags, Templates, Purchase Orders, Care
 */
export const STOCK_AUDIT_MESSAGES = {
  // ============================================================================
  // PRODUCTS - Gestão de produtos
  // ============================================================================

  /** Novo produto criado */
  PRODUCT_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PRODUCT,
    module: AuditModule.STOCK,
    description: '{{userName}} criou o produto {{productName}} (SKU: {{sku}})',
  } satisfies AuditMessage,

  /** Produto atualizado */
  PRODUCT_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PRODUCT,
    module: AuditModule.STOCK,
    description: '{{userName}} atualizou o produto {{productName}}',
  } satisfies AuditMessage,

  /** Produto excluído */
  PRODUCT_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.PRODUCT,
    module: AuditModule.STOCK,
    description: '{{userName}} excluiu o produto {{productName}}',
  } satisfies AuditMessage,

  /** Instruções de cuidado atribuídas ao produto */
  PRODUCT_CARE_SET: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PRODUCT,
    module: AuditModule.STOCK,
    description:
      '{{userName}} definiu instruções de cuidado para {{productName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // CATEGORIES - Gestão de categorias
  // ============================================================================

  /** Nova categoria criada */
  CATEGORY_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.CATEGORY,
    module: AuditModule.STOCK,
    description: '{{userName}} criou a categoria {{categoryName}}',
  } satisfies AuditMessage,

  /** Categoria atualizada */
  CATEGORY_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.CATEGORY,
    module: AuditModule.STOCK,
    description: '{{userName}} atualizou a categoria {{categoryName}}',
  } satisfies AuditMessage,

  /** Categoria excluída */
  CATEGORY_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.CATEGORY,
    module: AuditModule.STOCK,
    description: '{{userName}} excluiu a categoria {{categoryName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // VARIANTS - Gestão de variantes de produtos
  // ============================================================================

  /** Nova variante criada */
  VARIANT_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.VARIANT,
    module: AuditModule.STOCK,
    description:
      '{{userName}} criou a variante {{variantName}} do produto {{productName}}',
  } satisfies AuditMessage,

  /** Variante atualizada */
  VARIANT_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.VARIANT,
    module: AuditModule.STOCK,
    description: '{{userName}} atualizou a variante {{variantName}}',
  } satisfies AuditMessage,

  /** Variante excluída */
  VARIANT_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.VARIANT,
    module: AuditModule.STOCK,
    description: '{{userName}} excluiu a variante {{variantName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // ITEMS - Movimentação de estoque
  // ============================================================================

  /** Entrada de itens no estoque */
  ITEM_ENTRY: {
    action: AuditAction.STOCK_ENTRY,
    entity: AuditEntity.ITEM,
    module: AuditModule.STOCK,
    description:
      '{{userName}} registrou entrada de {{quantity}} unidades de {{productName}} no estoque {{locationName}}',
  } satisfies AuditMessage,

  /** Saída de itens do estoque */
  ITEM_EXIT: {
    action: AuditAction.STOCK_EXIT,
    entity: AuditEntity.ITEM,
    module: AuditModule.STOCK,
    description:
      '{{userName}} registrou saída de {{quantity}} unidades de {{productName}} do estoque {{locationName}}',
  } satisfies AuditMessage,

  /** Transferência de itens entre locais */
  ITEM_TRANSFER: {
    action: AuditAction.STOCK_TRANSFER,
    entity: AuditEntity.ITEM,
    module: AuditModule.STOCK,
    description:
      '{{userName}} transferiu {{quantity}} unidades de {{productName}} de {{fromLocation}} para {{toLocation}}',
  } satisfies AuditMessage,

  // ============================================================================
  // LOCATIONS - Gestão de localizações de armazenamento
  // ============================================================================

  /** Nova localização criada */
  LOCATION_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.LOCATION,
    module: AuditModule.STOCK,
    description: '{{userName}} criou a localização {{locationName}}',
  } satisfies AuditMessage,

  /** Localização atualizada */
  LOCATION_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.LOCATION,
    module: AuditModule.STOCK,
    description: '{{userName}} atualizou a localização {{locationName}}',
  } satisfies AuditMessage,

  /** Localização excluída */
  LOCATION_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.LOCATION,
    module: AuditModule.STOCK,
    description: '{{userName}} excluiu a localização {{locationName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // MANUFACTURERS - Gestão de fabricantes
  // ============================================================================

  /** Novo fabricante criado */
  MANUFACTURER_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.MANUFACTURER,
    module: AuditModule.STOCK,
    description: '{{userName}} cadastrou o fabricante {{manufacturerName}}',
  } satisfies AuditMessage,

  /** Fabricante atualizado */
  MANUFACTURER_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.MANUFACTURER,
    module: AuditModule.STOCK,
    description: '{{userName}} atualizou o fabricante {{manufacturerName}}',
  } satisfies AuditMessage,

  /** Fabricante excluído */
  MANUFACTURER_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.MANUFACTURER,
    module: AuditModule.STOCK,
    description: '{{userName}} excluiu o fabricante {{manufacturerName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // SUPPLIERS - Gestão de fornecedores
  // ============================================================================

  /** Novo fornecedor criado */
  SUPPLIER_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.SUPPLIER,
    module: AuditModule.STOCK,
    description: '{{userName}} cadastrou o fornecedor {{supplierName}}',
  } satisfies AuditMessage,

  /** Fornecedor atualizado */
  SUPPLIER_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.SUPPLIER,
    module: AuditModule.STOCK,
    description: '{{userName}} atualizou o fornecedor {{supplierName}}',
  } satisfies AuditMessage,

  /** Fornecedor excluído */
  SUPPLIER_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.SUPPLIER,
    module: AuditModule.STOCK,
    description: '{{userName}} excluiu o fornecedor {{supplierName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // TAGS - Gestão de tags
  // ============================================================================

  /** Nova tag criada */
  TAG_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.TAG,
    module: AuditModule.STOCK,
    description: '{{userName}} criou a tag {{tagName}}',
  } satisfies AuditMessage,

  /** Tag atualizada */
  TAG_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.TAG,
    module: AuditModule.STOCK,
    description: '{{userName}} atualizou a tag {{tagName}}',
  } satisfies AuditMessage,

  /** Tag excluída */
  TAG_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.TAG,
    module: AuditModule.STOCK,
    description: '{{userName}} excluiu a tag {{tagName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // TEMPLATES - Gestão de templates de produtos
  // ============================================================================

  /** Novo template criado */
  TEMPLATE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.TEMPLATE,
    module: AuditModule.STOCK,
    description: '{{userName}} criou o template {{templateName}}',
  } satisfies AuditMessage,

  /** Template atualizado */
  TEMPLATE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.TEMPLATE,
    module: AuditModule.STOCK,
    description: '{{userName}} atualizou o template {{templateName}}',
  } satisfies AuditMessage,

  /** Template excluído */
  TEMPLATE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.TEMPLATE,
    module: AuditModule.STOCK,
    description: '{{userName}} excluiu o template {{templateName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // PURCHASE ORDERS - Ordens de compra
  // ============================================================================

  /** Nova ordem de compra criada */
  PURCHASE_ORDER_CREATE: {
    action: AuditAction.ORDER_CREATE,
    entity: AuditEntity.PURCHASE_ORDER,
    module: AuditModule.STOCK,
    description:
      '{{userName}} criou a ordem de compra #{{orderNumber}} para {{supplierName}}',
  } satisfies AuditMessage,

  /** Ordem de compra cancelada */
  PURCHASE_ORDER_CANCEL: {
    action: AuditAction.ORDER_CANCEL,
    entity: AuditEntity.PURCHASE_ORDER,
    module: AuditModule.STOCK,
    description: '{{userName}} cancelou a ordem de compra #{{orderNumber}}',
  } satisfies AuditMessage,
} as const;

export type StockAuditMessageKey = keyof typeof STOCK_AUDIT_MESSAGES;
