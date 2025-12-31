import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { getAuditContext } from '@/http/hooks/audit-context.hook';
import { makeLogAuditUseCase } from '@/use-cases/audit/factories/make-log-audit-use-case';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Plugin Fastify para registro automático de audit logs GRANULAR
 *
 * Este plugin detecta automaticamente a ação específica baseada na URL completa,
 * não apenas no método HTTP. Isso permite descrições detalhadas como:
 * - "Usuário X alterou a senha do usuário Y"
 * - "Usuário X aprovou a folha de pagamento #123"
 * - "Usuário X registrou entrada de ponto"
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface AuditRouteConfig {
  action: AuditAction;
  entity: AuditEntity;
  description: string;
}

interface RoutePattern {
  pattern: RegExp;
  methods: string[];
  config: AuditRouteConfig;
}

// ============================================================================
// MAPEAMENTO DETALHADO DE ROTAS PARA AUDITORIA
// Ordenado do mais específico para o mais genérico (ordem importa!)
// ============================================================================

const ROUTE_AUDIT_MAP: RoutePattern[] = [
  // ============================================================================
  // AUTH - Autenticação
  // ============================================================================
  {
    pattern: /\/v1\/auth\/login\/password$/,
    methods: ['POST'],
    config: {
      action: AuditAction.LOGIN,
      entity: AuditEntity.SESSION,
      description: 'Usuário realizou login no sistema',
    },
  },
  {
    pattern: /\/v1\/auth\/register$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.USER,
      description: 'Novo usuário registrado no sistema',
    },
  },
  {
    pattern: /\/v1\/auth\/password-reset\/send$/,
    methods: ['POST'],
    config: {
      action: AuditAction.PASSWORD_RESET_REQUEST,
      entity: AuditEntity.USER_PASSWORD,
      description: 'Solicitação de reset de senha enviada',
    },
  },
  {
    pattern: /\/v1\/auth\/password-reset$/,
    methods: ['POST'],
    config: {
      action: AuditAction.PASSWORD_RESET_COMPLETE,
      entity: AuditEntity.USER_PASSWORD,
      description: 'Senha resetada com sucesso via token',
    },
  },

  // ============================================================================
  // SESSIONS - Sessões
  // ============================================================================
  {
    pattern: /\/v1\/sessions\/logout$/,
    methods: ['POST', 'PATCH', 'DELETE'],
    config: {
      action: AuditAction.LOGOUT,
      entity: AuditEntity.SESSION,
      description: 'Usuário realizou logout',
    },
  },
  {
    pattern: /\/v1\/sessions\/refresh$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.SESSION_REFRESH,
      entity: AuditEntity.SESSION,
      description: 'Sessão renovada',
    },
  },
  {
    pattern: /\/v1\/sessions\/[^/]+\/expire$/,
    methods: ['PATCH', 'POST'],
    config: {
      action: AuditAction.SESSION_EXPIRE,
      entity: AuditEntity.SESSION,
      description: 'Sessão expirada manualmente',
    },
  },
  {
    pattern: /\/v1\/sessions\/[^/]+\/revoke$/,
    methods: ['PATCH', 'POST'],
    config: {
      action: AuditAction.SESSION_REVOKE,
      entity: AuditEntity.SESSION,
      description: 'Sessão revogada',
    },
  },

  // ============================================================================
  // ME - Perfil do usuário logado
  // ============================================================================
  {
    pattern: /\/v1\/me\/email$/,
    methods: ['PATCH', 'PUT'],
    config: {
      action: AuditAction.EMAIL_CHANGE,
      entity: AuditEntity.USER_EMAIL,
      description: 'Usuário alterou seu próprio email',
    },
  },
  {
    pattern: /\/v1\/me\/password$/,
    methods: ['PATCH', 'PUT'],
    config: {
      action: AuditAction.PASSWORD_CHANGE,
      entity: AuditEntity.USER_PASSWORD,
      description: 'Usuário alterou sua própria senha',
    },
  },
  {
    pattern: /\/v1\/me\/username$/,
    methods: ['PATCH', 'PUT'],
    config: {
      action: AuditAction.USERNAME_CHANGE,
      entity: AuditEntity.USER_USERNAME,
      description: 'Usuário alterou seu próprio username',
    },
  },
  {
    pattern: /\/v1\/me\/profile$/,
    methods: ['PATCH', 'PUT'],
    config: {
      action: AuditAction.PROFILE_CHANGE,
      entity: AuditEntity.USER_PROFILE,
      description: 'Usuário alterou seu próprio perfil',
    },
  },
  {
    pattern: /\/v1\/me$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.USER,
      description: 'Usuário excluiu sua própria conta',
    },
  },

  // ============================================================================
  // USERS - Gerenciamento de usuários (por admin/manager)
  // ============================================================================
  {
    pattern: /\/v1\/users\/[^/]+\/force-password-reset$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.PASSWORD_FORCE_RESET,
      entity: AuditEntity.USER_PASSWORD,
      description: 'Sistema solicitou reset de senha forçado do usuário',
    },
  },
  {
    pattern: /\/v1\/users\/[^/]+\/email$/,
    methods: ['PATCH', 'PUT'],
    config: {
      action: AuditAction.EMAIL_CHANGE,
      entity: AuditEntity.USER_EMAIL,
      description: 'Email do usuário alterado pelo administrador',
    },
  },
  {
    pattern: /\/v1\/users\/[^/]+\/password$/,
    methods: ['PATCH', 'PUT'],
    config: {
      action: AuditAction.PASSWORD_CHANGE,
      entity: AuditEntity.USER_PASSWORD,
      description: 'Senha do usuário alterada pelo administrador',
    },
  },
  {
    pattern: /\/v1\/users\/[^/]+\/username$/,
    methods: ['PATCH', 'PUT'],
    config: {
      action: AuditAction.USERNAME_CHANGE,
      entity: AuditEntity.USER_USERNAME,
      description: 'Username do usuário alterado pelo administrador',
    },
  },
  {
    pattern: /\/v1\/users\/[^/]+\/profile$/,
    methods: ['PATCH', 'PUT'],
    config: {
      action: AuditAction.PROFILE_CHANGE,
      entity: AuditEntity.USER_PROFILE,
      description: 'Perfil do usuário alterado pelo administrador',
    },
  },
  {
    pattern: /\/v1\/users$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.USER,
      description: 'Novo usuário criado pelo administrador',
    },
  },
  {
    pattern: /\/v1\/users\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.USER,
      description: 'Usuário excluído pelo administrador',
    },
  },

  // ============================================================================
  // RBAC - PERMISSIONS
  // ============================================================================
  {
    pattern: /\/v1\/rbac\/permissions$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.PERMISSION,
      description: 'Nova permissão criada',
    },
  },
  {
    pattern: /\/v1\/rbac\/permissions\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.PERMISSION,
      description: 'Permissão atualizada',
    },
  },
  {
    pattern: /\/v1\/rbac\/permissions\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.PERMISSION,
      description: 'Permissão excluída',
    },
  },
  {
    pattern: /\/v1\/permissions$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.PERMISSION,
      description: 'Nova permissão criada',
    },
  },
  {
    pattern: /\/v1\/permissions\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.PERMISSION,
      description: 'Permissão atualizada',
    },
  },
  {
    pattern: /\/v1\/permissions\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.PERMISSION,
      description: 'Permissão excluída',
    },
  },

  // ============================================================================
  // RBAC - PERMISSION GROUPS
  // ============================================================================
  {
    pattern: /\/v1\/rbac\/permission-groups$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.PERMISSION_GROUP,
      description: 'Novo grupo de permissões criado',
    },
  },
  {
    pattern: /\/v1\/rbac\/permission-groups\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.PERMISSION_GROUP,
      description: 'Grupo de permissões atualizado',
    },
  },
  {
    pattern: /\/v1\/rbac\/permission-groups\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.PERMISSION_GROUP,
      description: 'Grupo de permissões excluído',
    },
  },
  {
    pattern: /\/v1\/permission-groups$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.PERMISSION_GROUP,
      description: 'Novo grupo de permissões criado',
    },
  },
  {
    pattern: /\/v1\/permission-groups\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.PERMISSION_GROUP,
      description: 'Grupo de permissões atualizado',
    },
  },
  {
    pattern: /\/v1\/permission-groups\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.PERMISSION_GROUP,
      description: 'Grupo de permissões excluído',
    },
  },

  // ============================================================================
  // RBAC - ASSOCIATIONS (Grupos e Permissões)
  // ============================================================================
  {
    pattern: /\/v1\/rbac\/groups\/[^/]+\/permissions$/,
    methods: ['POST'],
    config: {
      action: AuditAction.PERMISSION_ADD_TO_GROUP,
      entity: AuditEntity.PERMISSION_GROUP_PERMISSION,
      description: 'Permissão adicionada ao grupo',
    },
  },
  {
    pattern: /\/v1\/rbac\/groups\/[^/]+\/permissions\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.PERMISSION_REMOVE_FROM_GROUP,
      entity: AuditEntity.PERMISSION_GROUP_PERMISSION,
      description: 'Permissão removida do grupo',
    },
  },
  {
    pattern: /\/v1\/rbac\/users\/[^/]+\/groups$/,
    methods: ['POST'],
    config: {
      action: AuditAction.GROUP_ASSIGN,
      entity: AuditEntity.USER_PERMISSION_GROUP,
      description: 'Usuário adicionado ao grupo de permissões',
    },
  },
  {
    pattern: /\/v1\/rbac\/users\/[^/]+\/groups\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.GROUP_REMOVE,
      entity: AuditEntity.USER_PERMISSION_GROUP,
      description: 'Usuário removido do grupo de permissões',
    },
  },

  // ============================================================================
  // RBAC - USER DIRECT PERMISSIONS
  // ============================================================================
  {
    pattern: /\/v1\/rbac\/users\/[^/]+\/direct-permissions$/,
    methods: ['POST'],
    config: {
      action: AuditAction.PERMISSION_GRANT,
      entity: AuditEntity.USER_DIRECT_PERMISSION,
      description: 'Permissão direta concedida ao usuário',
    },
  },
  {
    pattern: /\/v1\/rbac\/users\/[^/]+\/direct-permissions\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.PERMISSION_UPDATE,
      entity: AuditEntity.USER_DIRECT_PERMISSION,
      description: 'Permissão direta do usuário atualizada',
    },
  },
  {
    pattern: /\/v1\/rbac\/users\/[^/]+\/direct-permissions\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.PERMISSION_REVOKE,
      entity: AuditEntity.USER_DIRECT_PERMISSION,
      description: 'Permissão direta revogada do usuário',
    },
  },

  // ============================================================================
  // STOCK - ITEMS (Movimentação de estoque) - ANTES de items genérico
  // ============================================================================
  {
    pattern: /\/v1\/items\/[^/]+\/entry$/,
    methods: ['POST'],
    config: {
      action: AuditAction.STOCK_ENTRY,
      entity: AuditEntity.ITEM,
      description: 'Entrada de item no estoque registrada',
    },
  },
  {
    pattern: /\/v1\/items\/[^/]+\/exit$/,
    methods: ['POST'],
    config: {
      action: AuditAction.STOCK_EXIT,
      entity: AuditEntity.ITEM,
      description: 'Saída de item do estoque registrada',
    },
  },
  {
    pattern: /\/v1\/items\/[^/]+\/transfer$/,
    methods: ['POST'],
    config: {
      action: AuditAction.STOCK_TRANSFER,
      entity: AuditEntity.ITEM,
      description: 'Transferência de item entre locais',
    },
  },

  // ============================================================================
  // STOCK - PRODUCTS
  // ============================================================================
  {
    pattern: /\/v1\/products$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.PRODUCT,
      description: 'Novo produto criado',
    },
  },
  {
    pattern: /\/v1\/products\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.PRODUCT,
      description: 'Produto atualizado',
    },
  },
  {
    pattern: /\/v1\/products\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.PRODUCT,
      description: 'Produto excluído',
    },
  },

  // ============================================================================
  // STOCK - VARIANTS
  // ============================================================================
  {
    pattern: /\/v1\/variants$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.VARIANT,
      description: 'Nova variante de produto criada',
    },
  },
  {
    pattern: /\/v1\/variants\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.VARIANT,
      description: 'Variante de produto atualizada',
    },
  },
  {
    pattern: /\/v1\/variants\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.VARIANT,
      description: 'Variante de produto excluída',
    },
  },

  // ============================================================================
  // STOCK - CATEGORIES
  // ============================================================================
  {
    pattern: /\/v1\/categories$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.CATEGORY,
      description: 'Nova categoria criada',
    },
  },
  {
    pattern: /\/v1\/categories\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.CATEGORY,
      description: 'Categoria atualizada',
    },
  },
  {
    pattern: /\/v1\/categories\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.CATEGORY,
      description: 'Categoria excluída',
    },
  },

  // ============================================================================
  // STOCK - SUPPLIERS
  // ============================================================================
  {
    pattern: /\/v1\/suppliers$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.SUPPLIER,
      description: 'Novo fornecedor criado',
    },
  },
  {
    pattern: /\/v1\/suppliers\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.SUPPLIER,
      description: 'Fornecedor atualizado',
    },
  },
  {
    pattern: /\/v1\/suppliers\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.SUPPLIER,
      description: 'Fornecedor excluído',
    },
  },

  // ============================================================================
  // STOCK - MANUFACTURERS
  // ============================================================================
  {
    pattern: /\/v1\/manufacturers$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.MANUFACTURER,
      description: 'Novo fabricante criado',
    },
  },
  {
    pattern: /\/v1\/manufacturers\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.MANUFACTURER,
      description: 'Fabricante atualizado',
    },
  },
  {
    pattern: /\/v1\/manufacturers\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.MANUFACTURER,
      description: 'Fabricante excluído',
    },
  },

  // ============================================================================
  // STOCK - LOCATIONS
  // ============================================================================
  {
    pattern: /\/v1\/locations$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.LOCATION,
      description: 'Nova localização criada',
    },
  },
  {
    pattern: /\/v1\/locations\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.LOCATION,
      description: 'Localização atualizada',
    },
  },
  {
    pattern: /\/v1\/locations\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.LOCATION,
      description: 'Localização excluída',
    },
  },

  // ============================================================================
  // STOCK - TEMPLATES
  // ============================================================================
  {
    pattern: /\/v1\/templates$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.TEMPLATE,
      description: 'Novo template criado',
    },
  },
  {
    pattern: /\/v1\/templates\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.TEMPLATE,
      description: 'Template atualizado',
    },
  },
  {
    pattern: /\/v1\/templates\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.TEMPLATE,
      description: 'Template excluído',
    },
  },

  // ============================================================================
  // STOCK - TAGS
  // ============================================================================
  {
    pattern: /\/v1\/tags$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.TAG,
      description: 'Nova tag criada',
    },
  },
  {
    pattern: /\/v1\/tags\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.TAG,
      description: 'Tag atualizada',
    },
  },
  {
    pattern: /\/v1\/tags\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.TAG,
      description: 'Tag excluída',
    },
  },

  // ============================================================================
  // STOCK - PURCHASE ORDERS
  // ============================================================================
  {
    pattern: /\/v1\/purchase-orders\/[^/]+\/cancel$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.ORDER_CANCEL,
      entity: AuditEntity.PURCHASE_ORDER,
      description: 'Pedido de compra cancelado',
    },
  },
  {
    pattern: /\/v1\/purchase-orders$/,
    methods: ['POST'],
    config: {
      action: AuditAction.ORDER_CREATE,
      entity: AuditEntity.PURCHASE_ORDER,
      description: 'Novo pedido de compra criado',
    },
  },

  // ============================================================================
  // STOCK - VARIANT PROMOTIONS
  // ============================================================================
  {
    pattern: /\/v1\/variant-promotions$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.VARIANT_PROMOTION,
      description: 'Nova promoção de variante criada',
    },
  },
  {
    pattern: /\/v1\/variant-promotions\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.VARIANT_PROMOTION,
      description: 'Promoção de variante atualizada',
    },
  },
  {
    pattern: /\/v1\/variant-promotions\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.VARIANT_PROMOTION,
      description: 'Promoção de variante excluída',
    },
  },

  // ============================================================================
  // SALES - CUSTOMERS
  // ============================================================================
  {
    pattern: /\/v1\/customers$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.CUSTOMER,
      description: 'Novo cliente criado',
    },
  },
  {
    pattern: /\/v1\/customers\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.CUSTOMER,
      description: 'Cliente atualizado',
    },
  },
  {
    pattern: /\/v1\/customers\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.CUSTOMER,
      description: 'Cliente excluído',
    },
  },

  // ============================================================================
  // SALES - SALES ORDERS
  // ============================================================================
  {
    pattern: /\/v1\/sales-orders\/[^/]+\/status$/,
    methods: ['PATCH', 'PUT'],
    config: {
      action: AuditAction.STATUS_CHANGE,
      entity: AuditEntity.SALES_ORDER,
      description: 'Status do pedido de venda alterado',
    },
  },
  {
    pattern: /\/v1\/sales-orders\/[^/]+\/cancel$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.ORDER_CANCEL,
      entity: AuditEntity.SALES_ORDER,
      description: 'Pedido de venda cancelado',
    },
  },
  {
    pattern: /\/v1\/sales-orders$/,
    methods: ['POST'],
    config: {
      action: AuditAction.ORDER_CREATE,
      entity: AuditEntity.SALES_ORDER,
      description: 'Novo pedido de venda criado',
    },
  },

  // ============================================================================
  // SALES - ITEM RESERVATIONS
  // ============================================================================
  {
    pattern: /\/v1\/item-reservations\/[^/]+\/release$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.RESERVATION_RELEASE,
      entity: AuditEntity.ITEM_RESERVATION,
      description: 'Reserva de item liberada',
    },
  },
  {
    pattern: /\/v1\/item-reservations$/,
    methods: ['POST'],
    config: {
      action: AuditAction.RESERVATION_CREATE,
      entity: AuditEntity.ITEM_RESERVATION,
      description: 'Reserva de item criada',
    },
  },

  // ============================================================================
  // SALES - COMMENTS
  // ============================================================================
  {
    pattern: /\/v1\/comments$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.COMMENT,
      description: 'Novo comentário criado',
    },
  },
  {
    pattern: /\/v1\/comments\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.COMMENT,
      description: 'Comentário atualizado',
    },
  },
  {
    pattern: /\/v1\/comments\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.COMMENT,
      description: 'Comentário excluído',
    },
  },

  // ============================================================================
  // SALES - NOTIFICATION PREFERENCES
  // ============================================================================
  {
    pattern: /\/v1\/notification-preferences$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.NOTIFICATION_PREFERENCE,
      description: 'Preferência de notificação criada',
    },
  },
  {
    pattern: /\/v1\/notification-preferences\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.NOTIFICATION_PREFERENCE,
      description: 'Preferência de notificação atualizada',
    },
  },
  {
    pattern: /\/v1\/notification-preferences\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.NOTIFICATION_PREFERENCE,
      description: 'Preferência de notificação excluída',
    },
  },

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================
  {
    pattern: /\/v1\/notifications\/mark-all-read$/,
    methods: ['PATCH', 'POST'],
    config: {
      action: AuditAction.NOTIFICATION_READ,
      entity: AuditEntity.NOTIFICATION,
      description: 'Todas notificações marcadas como lidas',
    },
  },
  {
    pattern: /\/v1\/notifications\/send-email$/,
    methods: ['POST'],
    config: {
      action: AuditAction.NOTIFICATION_SEND,
      entity: AuditEntity.NOTIFICATION,
      description: 'Notificação por email enviada',
    },
  },
  {
    pattern: /\/v1\/notifications\/process-scheduled$/,
    methods: ['POST'],
    config: {
      action: AuditAction.NOTIFICATION_SEND,
      entity: AuditEntity.NOTIFICATION,
      description: 'Notificações agendadas processadas',
    },
  },
  {
    pattern: /\/v1\/notifications\/[^/]+\/read$/,
    methods: ['PATCH', 'POST'],
    config: {
      action: AuditAction.NOTIFICATION_READ,
      entity: AuditEntity.NOTIFICATION,
      description: 'Notificação marcada como lida',
    },
  },
  {
    pattern: /\/v1\/notifications\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.NOTIFICATION_DELETE,
      entity: AuditEntity.NOTIFICATION,
      description: 'Notificação excluída',
    },
  },

  // ============================================================================
  // REQUESTS - Workflow de Solicitações (específicos primeiro)
  // ============================================================================
  {
    pattern: /\/v1\/requests\/[^/]+\/assign$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.REQUEST_ASSIGN,
      entity: AuditEntity.REQUEST,
      description: 'Solicitação atribuída a responsável',
    },
  },
  {
    pattern: /\/v1\/requests\/[^/]+\/complete$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.REQUEST_COMPLETE,
      entity: AuditEntity.REQUEST,
      description: 'Solicitação concluída',
    },
  },
  {
    pattern: /\/v1\/requests\/[^/]+\/cancel$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.REQUEST_CANCEL,
      entity: AuditEntity.REQUEST,
      description: 'Solicitação cancelada',
    },
  },
  {
    pattern: /\/v1\/requests\/[^/]+\/comments$/,
    methods: ['POST'],
    config: {
      action: AuditAction.REQUEST_COMMENT,
      entity: AuditEntity.REQUEST_COMMENT,
      description: 'Comentário adicionado à solicitação',
    },
  },
  {
    pattern: /\/v1\/requests\/[^/]+\/request-info$/,
    methods: ['POST'],
    config: {
      action: AuditAction.REQUEST_INFO,
      entity: AuditEntity.REQUEST,
      description: 'Informação adicional solicitada',
    },
  },
  {
    pattern: /\/v1\/requests\/[^/]+\/provide-info$/,
    methods: ['POST'],
    config: {
      action: AuditAction.REQUEST_INFO_PROVIDE,
      entity: AuditEntity.REQUEST,
      description: 'Informação adicional fornecida',
    },
  },
  {
    pattern: /\/v1\/requests$/,
    methods: ['POST'],
    config: {
      action: AuditAction.REQUEST_CREATE,
      entity: AuditEntity.REQUEST,
      description: 'Nova solicitação criada',
    },
  },

  // ============================================================================
  // HR - COMPANIES (Empresas)
  // ============================================================================
  {
    pattern: /\/v1\/hr\/companies\/check-cnpj$/,
    methods: ['POST', 'GET'],
    config: {
      action: AuditAction.CHECK_CNPJ,
      entity: AuditEntity.COMPANY,
      description: 'Verificação de CNPJ realizada',
    },
  },
  {
    pattern: /\/v1\/hr\/companies$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.COMPANY,
      description: 'Nova empresa criada',
    },
  },
  {
    pattern: /\/v1\/hr\/companies\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.COMPANY,
      description: 'Empresa atualizada',
    },
  },
  {
    pattern: /\/v1\/hr\/companies\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.COMPANY,
      description: 'Empresa excluída',
    },
  },

  // ============================================================================
  // HR - COMPANY ADDRESSES
  // ============================================================================
  {
    pattern: /\/v1\/hr\/company-addresses$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.COMPANY_ADDRESS,
      description: 'Novo endereço de empresa criado',
    },
  },
  {
    pattern: /\/v1\/hr\/company-addresses\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.COMPANY_ADDRESS,
      description: 'Endereço de empresa atualizado',
    },
  },
  {
    pattern: /\/v1\/hr\/company-addresses\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.COMPANY_ADDRESS,
      description: 'Endereço de empresa excluído',
    },
  },

  // ============================================================================
  // HR - COMPANY CNAEs
  // ============================================================================
  {
    pattern: /\/v1\/hr\/company-cnaes$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.COMPANY_CNAE,
      description: 'Novo CNAE de empresa criado',
    },
  },
  {
    pattern: /\/v1\/hr\/company-cnaes\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.COMPANY_CNAE,
      description: 'CNAE de empresa atualizado',
    },
  },
  {
    pattern: /\/v1\/hr\/company-cnaes\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.COMPANY_CNAE,
      description: 'CNAE de empresa excluído',
    },
  },

  // ============================================================================
  // HR - COMPANY FISCAL SETTINGS
  // ============================================================================
  {
    pattern: /\/v1\/hr\/company-fiscal-settings$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.COMPANY_FISCAL_SETTINGS,
      description: 'Configurações fiscais da empresa criadas',
    },
  },
  {
    pattern: /\/v1\/hr\/company-fiscal-settings\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.COMPANY_FISCAL_SETTINGS,
      description: 'Configurações fiscais da empresa atualizadas',
    },
  },
  {
    pattern: /\/v1\/hr\/company-fiscal-settings\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.COMPANY_FISCAL_SETTINGS,
      description: 'Configurações fiscais da empresa excluídas',
    },
  },

  // ============================================================================
  // HR - COMPANY STAKEHOLDERS
  // ============================================================================
  {
    pattern: /\/v1\/hr\/company-stakeholder[s]?$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.COMPANY_STAKEHOLDER,
      description: 'Novo sócio/stakeholder da empresa criado',
    },
  },
  {
    pattern: /\/v1\/hr\/company-stakeholder[s]?\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.COMPANY_STAKEHOLDER,
      description: 'Sócio/stakeholder da empresa atualizado',
    },
  },
  {
    pattern: /\/v1\/hr\/company-stakeholder[s]?\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.COMPANY_STAKEHOLDER,
      description: 'Sócio/stakeholder da empresa excluído',
    },
  },

  // ============================================================================
  // HR - EMPLOYEES (específicos primeiro)
  // ============================================================================
  {
    pattern: /\/v1\/hr\/employees\/check-cpf$/,
    methods: ['POST', 'GET'],
    config: {
      action: AuditAction.CHECK_CPF,
      entity: AuditEntity.EMPLOYEE,
      description: 'Verificação de CPF realizada',
    },
  },
  {
    pattern: /\/v1\/hr\/employees-with-user$/,
    methods: ['POST'],
    config: {
      action: AuditAction.EMPLOYEE_HIRE,
      entity: AuditEntity.EMPLOYEE,
      description: 'Novo funcionário contratado com usuário vinculado',
    },
  },
  {
    pattern: /\/v1\/hr\/employees\/[^/]+\/terminate$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.EMPLOYEE_TERMINATE,
      entity: AuditEntity.EMPLOYEE,
      description: 'Funcionário desligado',
    },
  },
  {
    pattern: /\/v1\/hr\/employees\/[^/]+\/transfer$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.EMPLOYEE_TRANSFER,
      entity: AuditEntity.EMPLOYEE,
      description: 'Funcionário transferido de departamento/cargo',
    },
  },
  {
    pattern: /\/v1\/hr\/employees\/[^/]+\/link-user$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.EMPLOYEE_LINK_USER,
      entity: AuditEntity.EMPLOYEE,
      description: 'Usuário do sistema vinculado ao funcionário',
    },
  },
  {
    pattern: /\/v1\/hr\/employees$/,
    methods: ['POST'],
    config: {
      action: AuditAction.EMPLOYEE_HIRE,
      entity: AuditEntity.EMPLOYEE,
      description: 'Novo funcionário contratado',
    },
  },
  {
    pattern: /\/v1\/hr\/employees\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.EMPLOYEE,
      description: 'Dados do funcionário atualizados',
    },
  },
  {
    pattern: /\/v1\/hr\/employees\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.EMPLOYEE,
      description: 'Funcionário excluído',
    },
  },

  // ============================================================================
  // HR - DEPARTMENTS
  // ============================================================================
  {
    pattern: /\/v1\/hr\/departments$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.DEPARTMENT,
      description: 'Novo departamento criado',
    },
  },
  {
    pattern: /\/v1\/hr\/departments\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.DEPARTMENT,
      description: 'Departamento atualizado',
    },
  },
  {
    pattern: /\/v1\/hr\/departments\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.DEPARTMENT,
      description: 'Departamento excluído',
    },
  },

  // ============================================================================
  // HR - POSITIONS
  // ============================================================================
  {
    pattern: /\/v1\/hr\/positions$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.POSITION,
      description: 'Novo cargo criado',
    },
  },
  {
    pattern: /\/v1\/hr\/positions\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.POSITION,
      description: 'Cargo atualizado',
    },
  },
  {
    pattern: /\/v1\/hr\/positions\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.POSITION,
      description: 'Cargo excluído',
    },
  },

  // ============================================================================
  // HR - TIME CONTROL (Ponto)
  // ============================================================================
  {
    pattern: /\/v1\/hr\/time-control\/clock-in$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CLOCK_IN,
      entity: AuditEntity.TIME_ENTRY,
      description: 'Registro de entrada de ponto',
    },
  },
  {
    pattern: /\/v1\/hr\/time-control\/clock-out$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CLOCK_OUT,
      entity: AuditEntity.TIME_ENTRY,
      description: 'Registro de saída de ponto',
    },
  },
  {
    pattern: /\/v1\/hr\/time-control\/calculate/,
    methods: ['POST', 'GET'],
    config: {
      action: AuditAction.TIME_CALCULATE,
      entity: AuditEntity.TIME_ENTRY,
      description: 'Cálculo de horas trabalhadas realizado',
    },
  },

  // ============================================================================
  // HR - WORK SCHEDULES
  // ============================================================================
  {
    pattern: /\/v1\/hr\/work-schedules$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.WORK_SCHEDULE,
      description: 'Nova escala de trabalho criada',
    },
  },
  {
    pattern: /\/v1\/hr\/work-schedules\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.WORK_SCHEDULE,
      description: 'Escala de trabalho atualizada',
    },
  },
  {
    pattern: /\/v1\/hr\/work-schedules\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.WORK_SCHEDULE,
      description: 'Escala de trabalho excluída',
    },
  },

  // ============================================================================
  // HR - OVERTIME (Horas Extras)
  // ============================================================================
  {
    pattern: /\/v1\/hr\/overtime\/[^/]+\/approve$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.OVERTIME_APPROVE,
      entity: AuditEntity.OVERTIME,
      description: 'Hora extra aprovada',
    },
  },
  {
    pattern: /\/v1\/hr\/overtime$/,
    methods: ['POST'],
    config: {
      action: AuditAction.OVERTIME_REQUEST,
      entity: AuditEntity.OVERTIME,
      description: 'Solicitação de hora extra registrada',
    },
  },

  // ============================================================================
  // HR - TIME BANK (Banco de Horas)
  // ============================================================================
  {
    pattern: /\/v1\/hr\/time-bank\/[^/]+\/credit$/,
    methods: ['POST'],
    config: {
      action: AuditAction.TIME_BANK_CREDIT,
      entity: AuditEntity.TIME_BANK,
      description: 'Crédito registrado no banco de horas',
    },
  },
  {
    pattern: /\/v1\/hr\/time-bank\/[^/]+\/debit$/,
    methods: ['POST'],
    config: {
      action: AuditAction.TIME_BANK_DEBIT,
      entity: AuditEntity.TIME_BANK,
      description: 'Débito registrado no banco de horas',
    },
  },
  {
    pattern: /\/v1\/hr\/time-bank\/[^/]+\/adjust$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.TIME_BANK_ADJUST,
      entity: AuditEntity.TIME_BANK,
      description: 'Ajuste realizado no banco de horas',
    },
  },

  // ============================================================================
  // HR - ABSENCES (Ausências)
  // ============================================================================
  {
    pattern: /\/v1\/hr\/absences\/vacation$/,
    methods: ['POST'],
    config: {
      action: AuditAction.ABSENCE_REQUEST,
      entity: AuditEntity.ABSENCE,
      description: 'Solicitação de férias registrada',
    },
  },
  {
    pattern: /\/v1\/hr\/absences\/sick-leave$/,
    methods: ['POST'],
    config: {
      action: AuditAction.ABSENCE_REQUEST,
      entity: AuditEntity.ABSENCE,
      description: 'Atestado médico registrado',
    },
  },
  {
    pattern: /\/v1\/hr\/absences\/[^/]+\/approve$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.ABSENCE_APPROVE,
      entity: AuditEntity.ABSENCE,
      description: 'Ausência aprovada',
    },
  },
  {
    pattern: /\/v1\/hr\/absences\/[^/]+\/reject$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.ABSENCE_REJECT,
      entity: AuditEntity.ABSENCE,
      description: 'Ausência rejeitada',
    },
  },
  {
    pattern: /\/v1\/hr\/absences\/[^/]+\/cancel$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.ABSENCE_CANCEL,
      entity: AuditEntity.ABSENCE,
      description: 'Ausência cancelada',
    },
  },

  // ============================================================================
  // HR - VACATION PERIODS (Períodos de Férias)
  // ============================================================================
  {
    pattern: /\/v1\/hr\/vacation-periods\/[^/]+\/schedule$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.VACATION_SCHEDULE,
      entity: AuditEntity.VACATION_PERIOD,
      description: 'Férias agendadas',
    },
  },
  {
    pattern: /\/v1\/hr\/vacation-periods\/[^/]+\/start$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.VACATION_START,
      entity: AuditEntity.VACATION_PERIOD,
      description: 'Férias iniciadas',
    },
  },
  {
    pattern: /\/v1\/hr\/vacation-periods\/[^/]+\/complete$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.VACATION_COMPLETE,
      entity: AuditEntity.VACATION_PERIOD,
      description: 'Férias concluídas',
    },
  },
  {
    pattern: /\/v1\/hr\/vacation-periods\/[^/]+\/cancel$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.VACATION_CANCEL,
      entity: AuditEntity.VACATION_PERIOD,
      description: 'Férias canceladas',
    },
  },
  {
    pattern: /\/v1\/hr\/vacation-periods\/[^/]+\/sell$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.VACATION_SELL,
      entity: AuditEntity.VACATION_PERIOD,
      description: 'Dias de férias vendidos',
    },
  },
  {
    pattern: /\/v1\/hr\/vacation-periods$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.VACATION_PERIOD,
      description: 'Período aquisitivo de férias criado',
    },
  },

  // ============================================================================
  // PAYROLL - BONUSES
  // ============================================================================
  {
    pattern: /\/v1\/hr\/bonuses$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.BONUS,
      description: 'Novo bônus criado',
    },
  },
  {
    pattern: /\/v1\/hr\/bonuses\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.BONUS,
      description: 'Bônus excluído',
    },
  },

  // ============================================================================
  // PAYROLL - DEDUCTIONS
  // ============================================================================
  {
    pattern: /\/v1\/hr\/deductions$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.DEDUCTION,
      description: 'Nova dedução criada',
    },
  },
  {
    pattern: /\/v1\/hr\/deductions\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.DEDUCTION,
      description: 'Dedução excluída',
    },
  },

  // ============================================================================
  // PAYROLL - PAYROLLS (Folhas de Pagamento)
  // ============================================================================
  {
    pattern: /\/v1\/hr\/payrolls\/[^/]+\/calculate$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.PAYROLL_CALCULATE,
      entity: AuditEntity.PAYROLL,
      description: 'Folha de pagamento calculada',
    },
  },
  {
    pattern: /\/v1\/hr\/payrolls\/[^/]+\/approve$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.PAYROLL_APPROVE,
      entity: AuditEntity.PAYROLL,
      description: 'Folha de pagamento aprovada',
    },
  },
  {
    pattern: /\/v1\/hr\/payrolls\/[^/]+\/cancel$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.PAYROLL_CANCEL,
      entity: AuditEntity.PAYROLL,
      description: 'Folha de pagamento cancelada',
    },
  },
  {
    pattern: /\/v1\/hr\/payrolls\/[^/]+\/pay$/,
    methods: ['POST', 'PATCH'],
    config: {
      action: AuditAction.PAYROLL_PAY,
      entity: AuditEntity.PAYROLL,
      description: 'Folha de pagamento paga',
    },
  },
  {
    pattern: /\/v1\/hr\/payrolls$/,
    methods: ['POST'],
    config: {
      action: AuditAction.PAYROLL_CREATE,
      entity: AuditEntity.PAYROLL,
      description: 'Nova folha de pagamento criada',
    },
  },

  // ============================================================================
  // HR - SUPPLIERS
  // ============================================================================
  {
    pattern: /\/v1\/hr\/suppliers$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.SUPPLIER,
      description: 'Novo fornecedor criado (HR)',
    },
  },
  {
    pattern: /\/v1\/hr\/suppliers\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.SUPPLIER,
      description: 'Fornecedor atualizado (HR)',
    },
  },
  {
    pattern: /\/v1\/hr\/suppliers\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.SUPPLIER,
      description: 'Fornecedor excluído (HR)',
    },
  },

  // ============================================================================
  // HR - MANUFACTURERS
  // ============================================================================
  {
    pattern: /\/v1\/hr\/manufacturers$/,
    methods: ['POST'],
    config: {
      action: AuditAction.CREATE,
      entity: AuditEntity.MANUFACTURER,
      description: 'Novo fabricante criado (HR)',
    },
  },
  {
    pattern: /\/v1\/hr\/manufacturers\/[^/]+$/,
    methods: ['PUT', 'PATCH'],
    config: {
      action: AuditAction.UPDATE,
      entity: AuditEntity.MANUFACTURER,
      description: 'Fabricante atualizado (HR)',
    },
  },
  {
    pattern: /\/v1\/hr\/manufacturers\/[^/]+$/,
    methods: ['DELETE'],
    config: {
      action: AuditAction.DELETE,
      entity: AuditEntity.MANUFACTURER,
      description: 'Fabricante excluído (HR)',
    },
  },
];

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function shouldIgnoreRoute(method: string, url: string): boolean {
  if (method === 'GET') return true;
  if (url.includes('/health')) return true;
  if (url.includes('/audit-logs')) return true;
  if (url.includes('/sessions/refresh')) return true;
  return false;
}

function findRouteConfig(
  method: string,
  url: string,
): AuditRouteConfig | null {
  const cleanUrl = url.split('?')[0];

  for (const route of ROUTE_AUDIT_MAP) {
    if (route.methods.includes(method) && route.pattern.test(cleanUrl)) {
      return route.config;
    }
  }

  return null;
}

function inferEntityFromUrl(url: string): AuditEntity {
  const cleanUrl = url.split('?')[0].toLowerCase();

  // Mapeamento de segmentos de URL para entidades
  const urlEntityMap: Array<{ pattern: RegExp; entity: AuditEntity }> = [
    // Core
    { pattern: /\/users/, entity: AuditEntity.USER },
    { pattern: /\/sessions/, entity: AuditEntity.SESSION },
    { pattern: /\/auth/, entity: AuditEntity.SESSION },
    { pattern: /\/me/, entity: AuditEntity.USER },

    // RBAC
    { pattern: /\/permissions/, entity: AuditEntity.PERMISSION },
    { pattern: /\/permission-groups/, entity: AuditEntity.PERMISSION_GROUP },
    { pattern: /\/direct-permissions/, entity: AuditEntity.USER_DIRECT_PERMISSION },
    { pattern: /\/groups/, entity: AuditEntity.PERMISSION_GROUP },

    // Stock
    { pattern: /\/products/, entity: AuditEntity.PRODUCT },
    { pattern: /\/variants/, entity: AuditEntity.VARIANT },
    { pattern: /\/items/, entity: AuditEntity.ITEM },
    { pattern: /\/categories/, entity: AuditEntity.CATEGORY },
    { pattern: /\/suppliers/, entity: AuditEntity.SUPPLIER },
    { pattern: /\/manufacturers/, entity: AuditEntity.MANUFACTURER },
    { pattern: /\/locations/, entity: AuditEntity.LOCATION },
    { pattern: /\/templates/, entity: AuditEntity.TEMPLATE },
    { pattern: /\/tags/, entity: AuditEntity.TAG },
    { pattern: /\/purchase-orders/, entity: AuditEntity.PURCHASE_ORDER },
    { pattern: /\/variant-promotions/, entity: AuditEntity.VARIANT_PROMOTION },

    // Sales
    { pattern: /\/customers/, entity: AuditEntity.CUSTOMER },
    { pattern: /\/sales-orders/, entity: AuditEntity.SALES_ORDER },
    { pattern: /\/item-reservations/, entity: AuditEntity.ITEM_RESERVATION },
    { pattern: /\/comments/, entity: AuditEntity.COMMENT },
    { pattern: /\/notification-preferences/, entity: AuditEntity.NOTIFICATION_PREFERENCE },

    // Notifications
    { pattern: /\/notifications/, entity: AuditEntity.NOTIFICATION },

    // Requests
    { pattern: /\/requests/, entity: AuditEntity.REQUEST },

    // HR - Companies
    { pattern: /\/companies/, entity: AuditEntity.COMPANY },
    { pattern: /\/company-addresses/, entity: AuditEntity.COMPANY_ADDRESS },
    { pattern: /\/company-cnaes/, entity: AuditEntity.COMPANY_CNAE },
    { pattern: /\/company-fiscal-settings/, entity: AuditEntity.COMPANY_FISCAL_SETTINGS },
    { pattern: /\/company-stakeholder/, entity: AuditEntity.COMPANY_STAKEHOLDER },

    // HR - Structure
    { pattern: /\/employees/, entity: AuditEntity.EMPLOYEE },
    { pattern: /\/departments/, entity: AuditEntity.DEPARTMENT },
    { pattern: /\/positions/, entity: AuditEntity.POSITION },

    // HR - Time
    { pattern: /\/time-control/, entity: AuditEntity.TIME_ENTRY },
    { pattern: /\/work-schedules/, entity: AuditEntity.WORK_SCHEDULE },
    { pattern: /\/overtime/, entity: AuditEntity.OVERTIME },
    { pattern: /\/time-bank/, entity: AuditEntity.TIME_BANK },

    // HR - Absences
    { pattern: /\/absences/, entity: AuditEntity.ABSENCE },
    { pattern: /\/vacation-periods/, entity: AuditEntity.VACATION_PERIOD },

    // Payroll
    { pattern: /\/payrolls/, entity: AuditEntity.PAYROLL },
    { pattern: /\/bonuses/, entity: AuditEntity.BONUS },
    { pattern: /\/deductions/, entity: AuditEntity.DEDUCTION },
  ];

  for (const mapping of urlEntityMap) {
    if (mapping.pattern.test(cleanUrl)) {
      return mapping.entity;
    }
  }

  return AuditEntity.OTHER;
}

function getFallbackConfig(method: string, url: string): AuditRouteConfig {
  let action: AuditAction;
  switch (method) {
    case 'POST':
      action = AuditAction.CREATE;
      break;
    case 'PUT':
    case 'PATCH':
      action = AuditAction.UPDATE;
      break;
    case 'DELETE':
      action = AuditAction.DELETE;
      break;
    default:
      action = AuditAction.OTHER;
  }

  const entity = inferEntityFromUrl(url);

  return {
    action,
    entity,
    description: `${action} em ${entity}`,
  };
}

function parsePayload(payload: unknown): unknown {
  if (!payload) return null;
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch {
      return payload;
    }
  }

  if (Buffer.isBuffer(payload)) {
    try {
      return JSON.parse(payload.toString());
    } catch {
      return payload.toString();
    }
  }

  return payload;
}

function extractEntityId(
  request: FastifyRequest,
  responseBody: unknown,
): string | null {
  const params = request.params as Record<string, unknown> | undefined;

  // Prioridade: param chamado "id"
  if (params?.id && typeof params.id === 'string') {
    return params.id;
  }

  // Depois: qualquer param terminado em "Id"
  if (params) {
    const idParam = Object.entries(params).find(
      ([key, value]) =>
        key.toLowerCase().endsWith('id') && typeof value === 'string',
    );

    if (idParam) {
      return idParam[1] as string;
    }
  }

  // Para PUT/PATCH/DELETE tentar último segmento do path (se for UUID-like)
  if (['PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const cleanUrl = request.url.split('?')[0];
    const segments = cleanUrl.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    // UUID tem 36 caracteres, CUID tem ~25
    if (last && last.length >= 20 && !/^(approve|cancel|reject|complete|start|schedule|sell|credit|debit|adjust|terminate|transfer|link-user|clock-in|clock-out|calculate|release|assign|request-info|provide-info|read|logout|expire|revoke)$/i.test(last)) {
      return last;
    }
    // Tentar penúltimo segmento se o último for uma ação
    if (segments.length >= 2) {
      const secondLast = segments[segments.length - 2];
      if (secondLast && secondLast.length >= 20) {
        return secondLast;
      }
    }
  }

  // Para POST, tentar achar um id no corpo de resposta
  if (responseBody && typeof responseBody === 'object') {
    const body = responseBody as Record<string, unknown>;
    if (typeof body.id === 'string') {
      return body.id;
    }

    // Procurar profundamente o primeiro objeto que contenha id
    const stack: unknown[] = [responseBody];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || typeof current !== 'object') continue;

      const obj = current as Record<string, unknown>;
      if (typeof obj.id === 'string') {
        return obj.id;
      }

      for (const value of Object.values(obj)) {
        if (value && typeof value === 'object') {
          stack.push(value);
        }
      }
    }
  }

  return null;
}

// Storage para oldData capturado antes da operação
const oldDataStorage = new Map<string, Record<string, unknown>>();

function getRequestKey(request: FastifyRequest): string {
  return `${request.id}-${request.method}-${request.url}`;
}

// ============================================================================
// PLUGIN PRINCIPAL
// ============================================================================

async function auditLoggerPlugin(fastify: FastifyInstance): Promise<void> {
  // Hook onRequest para capturar oldData ANTES da operação
  fastify.addHook(
    'onRequest',
    async (request: FastifyRequest, _reply: FastifyReply) => {
      if (shouldIgnoreRoute(request.method, request.url)) return;

      const routeConfig = findRouteConfig(request.method, request.url);

      // Não captura oldData para ações de criação
      const createActions = [
        AuditAction.CREATE,
        AuditAction.LOGIN,
        AuditAction.EMPLOYEE_HIRE,
        AuditAction.ORDER_CREATE,
        AuditAction.REQUEST_CREATE,
        AuditAction.PAYROLL_CREATE,
        AuditAction.RESERVATION_CREATE,
      ];

      if (routeConfig && createActions.includes(routeConfig.action)) {
        return;
      }

      try {
        const params = request.params as Record<string, unknown> | undefined;
        if (params) {
          const requestKey = getRequestKey(request);
          oldDataStorage.set(requestKey, { ...params });
        }
      } catch {
        // Silencioso
      }
    },
  );

  // Hook onSend para registrar auditoria
  fastify.addHook(
    'onSend',
    async (request: FastifyRequest, reply: FastifyReply, payload: unknown) => {
      if (shouldIgnoreRoute(request.method, request.url)) return payload;

      // Não auditar respostas de erro
      if (reply.statusCode >= 400) return payload;

      try {
        const context = getAuditContext();
        const responseBody = parsePayload(payload);

        // Encontra configuração específica ou usa fallback
        const routeConfig =
          findRouteConfig(request.method, request.url) ||
          getFallbackConfig(request.method, request.url);

        const entityId = extractEntityId(request, responseBody) || 'unknown';

        // Recuperar oldData se existir
        const requestKey = getRequestKey(request);
        const oldData = oldDataStorage.get(requestKey);
        oldDataStorage.delete(requestKey);

        const logAudit = makeLogAuditUseCase();

        await logAudit.execute({
          action: routeConfig.action,
          entity: routeConfig.entity,
          entityId,
          oldData: oldData || null,
          newData: request.body as Record<string, unknown> | null,
          userId: context?.userId,
          ip: context?.ip,
          userAgent: context?.userAgent,
          endpoint: context?.endpoint,
          method: context?.method,
          description: routeConfig.description,
        });
      } catch (error) {
        console.error('[AUDIT] Failed to log:', error);
      }

      return payload;
    },
  );
}

export default fp(auditLoggerPlugin, {
  name: 'audit-logger',
  fastify: '5.x',
});
