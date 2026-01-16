import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';

/**
 * Estrutura de uma mensagem de auditoria
 *
 * A description suporta placeholders no formato {{nomeDaVariavel}}
 * que serão substituídos pelos valores fornecidos no momento do log.
 *
 * Exemplos de placeholders:
 * - {{userName}} - Nome do usuário que executou a ação
 * - {{adminName}} - Nome do administrador
 * - {{entityName}} - Nome da entidade afetada
 * - {{oldValue}} - Valor antigo
 * - {{newValue}} - Novo valor
 */
export interface AuditMessage {
  /** Ação realizada (CREATE, UPDATE, DELETE, etc.) */
  action: AuditAction;

  /** Entidade afetada (USER, EMPLOYEE, PRODUCT, etc.) */
  entity: AuditEntity;

  /** Módulo do sistema (CORE, HR, STOCK, etc.) */
  module: AuditModule;

  /**
   * Descrição humanizada da ação com placeholders
   * Exemplo: "{{adminName}} cadastrou o funcionário {{employeeName}}"
   */
  description: string;
}

/**
 * Tipo para o mapa de mensagens de um módulo
 */
export type AuditMessagesMap = Record<string, AuditMessage>;
