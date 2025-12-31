/**
 * Zod Schemas Index
 * Exporta todos os schemas reutilizáveis
 *
 * ⚠️ ESTRUTURA MODULAR COMPLETA IMPLEMENTADA
 * Todos os schemas foram refatorados seguindo o princípio da responsabilidade única.
 *
 * Nova estrutura de diretórios:
 * @see src/http/schemas/common.schema - Schemas compartilhados
 * @see src/http/schemas/core/ - Schemas core (auth, sessions, users)
 * @see src/http/schemas/notifications/ - Schemas de Notificações
 * @see src/http/schemas/hr/ - Schemas de Recursos Humanos (28 arquivos)
 * @see src/http/schemas/sales/ - Schemas de Vendas (16 arquivos)
 * @see src/http/schemas/stock/ - Schemas de Estoque (24 arquivos)
 * @see src/http/schemas/rbac/ - Schemas de Controle de Acesso
 *
 * 📋 Camadas de compatibilidade:
 * Todos os imports antigos continuam funcionando através de camadas de compatibilidade.
 * Para novos desenvolvimentos, prefira importar diretamente dos módulos específicos.
 */

// Common schemas (shared utilities)
export * from './common.schema';

// Core domain schemas (modular: ./core/*)
export * from './auth.schema'; // → ./core/auth
export * from './session.schema'; // → ./core/sessions
export * from './user.schema'; // → ./core/users

// Notifications (modular: ./notifications/*)
export * from './notification.schema'; // → ./notifications

// Business domain schemas (all modular)
export * from './hr.schema'; // → ./hr/* (28 arquivos modulares - includes manufacturers & suppliers)
export * from './sales.schema'; // → ./sales/* (16 arquivos modulares)
export * from './stock.schema'; // → ./stock/* (24 arquivos modulares + product.schema compatibility)
export * from './rbac.schema'; // → ./rbac/* (schemas RBAC)
