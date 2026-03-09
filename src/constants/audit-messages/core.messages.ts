import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import type { AuditMessage } from './types';

/**
 * Mensagens de auditoria do módulo CORE
 *
 * Inclui: Auth, Me (perfil próprio), Sessions, Users (gestão por admin)
 */
export const CORE_AUDIT_MESSAGES = {
  // ============================================================================
  // AUTH - Autenticação
  // ============================================================================

  /** Usuário realizou login com sucesso */
  AUTH_LOGIN: {
    action: AuditAction.LOGIN,
    entity: AuditEntity.SESSION,
    module: AuditModule.CORE,
    description: '{{userName}} acessou o sistema',
  } satisfies AuditMessage,

  /** Novo usuário se registrou no sistema */
  AUTH_REGISTER: {
    action: AuditAction.CREATE,
    entity: AuditEntity.USER,
    module: AuditModule.CORE,
    description: 'Novo usuário {{userName}} se registrou no sistema',
  } satisfies AuditMessage,

  /** Solicitação de token de reset de senha */
  AUTH_PASSWORD_RESET_REQUEST: {
    action: AuditAction.PASSWORD_RESET_REQUEST,
    entity: AuditEntity.USER_PASSWORD,
    module: AuditModule.CORE,
    description: 'Solicitação de reset de senha para {{email}}',
  } satisfies AuditMessage,

  /** Senha resetada via token com sucesso */
  AUTH_PASSWORD_RESET_COMPLETE: {
    action: AuditAction.PASSWORD_RESET_COMPLETE,
    entity: AuditEntity.USER_PASSWORD,
    module: AuditModule.CORE,
    description: '{{userName}} redefiniu sua senha via token de recuperação',
  } satisfies AuditMessage,

  // ============================================================================
  // ME - Perfil do usuário logado (ações próprias)
  // ============================================================================

  /** Usuário alterou seu próprio email */
  ME_EMAIL_CHANGE: {
    action: AuditAction.EMAIL_CHANGE,
    entity: AuditEntity.USER_EMAIL,
    module: AuditModule.CORE,
    description:
      '{{userName}} alterou seu email de {{oldEmail}} para {{newEmail}}',
  } satisfies AuditMessage,

  /** Usuário alterou sua própria senha */
  ME_PASSWORD_CHANGE: {
    action: AuditAction.PASSWORD_CHANGE,
    entity: AuditEntity.USER_PASSWORD,
    module: AuditModule.CORE,
    description: '{{userName}} alterou a própria senha',
  } satisfies AuditMessage,

  /** Usuário alterou seu PIN de acesso */
  ME_ACCESS_PIN_CHANGE: {
    action: AuditAction.PIN_CHANGE,
    entity: AuditEntity.USER_ACCESS_PIN,
    module: AuditModule.CORE,
    description: '{{userName}} alterou o próprio PIN de acesso',
  } satisfies AuditMessage,

  /** Usuário alterou seu PIN de ação */
  ME_ACTION_PIN_CHANGE: {
    action: AuditAction.PIN_CHANGE,
    entity: AuditEntity.USER_ACTION_PIN,
    module: AuditModule.CORE,
    description: '{{userName}} alterou o próprio PIN de autorização',
  } satisfies AuditMessage,

  /** Usuário alterou seu próprio username */
  ME_USERNAME_CHANGE: {
    action: AuditAction.USERNAME_CHANGE,
    entity: AuditEntity.USER_USERNAME,
    module: AuditModule.CORE,
    description:
      '{{userName}} alterou seu username de {{oldUsername}} para {{newUsername}}',
  } satisfies AuditMessage,

  /** Usuário atualizou seu próprio perfil */
  ME_PROFILE_CHANGE: {
    action: AuditAction.PROFILE_CHANGE,
    entity: AuditEntity.USER_PROFILE,
    module: AuditModule.CORE,
    description: '{{userName}} atualizou o próprio perfil',
  } satisfies AuditMessage,

  /** Usuário excluiu sua própria conta */
  ME_ACCOUNT_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.USER,
    module: AuditModule.CORE,
    description: '{{userName}} excluiu sua própria conta',
  } satisfies AuditMessage,

  // ============================================================================
  // SESSIONS - Gerenciamento de sessões
  // ============================================================================

  /** Usuário realizou logout */
  SESSION_LOGOUT: {
    action: AuditAction.LOGOUT,
    entity: AuditEntity.SESSION,
    module: AuditModule.CORE,
    description: '{{userName}} saiu do sistema',
  } satisfies AuditMessage,

  /** Sessão foi renovada */
  SESSION_REFRESH: {
    action: AuditAction.SESSION_REFRESH,
    entity: AuditEntity.SESSION,
    module: AuditModule.CORE,
    description: 'Sessão de {{userName}} foi renovada',
  } satisfies AuditMessage,

  /** Admin expirou sessão de outro usuário */
  SESSION_EXPIRE: {
    action: AuditAction.SESSION_EXPIRE,
    entity: AuditEntity.SESSION,
    module: AuditModule.CORE,
    description: '{{adminName}} expirou a sessão de {{userName}}',
  } satisfies AuditMessage,

  /** Admin revogou sessão de outro usuário */
  SESSION_REVOKE: {
    action: AuditAction.SESSION_REVOKE,
    entity: AuditEntity.SESSION,
    module: AuditModule.CORE,
    description: '{{adminName}} revogou a sessão de {{userName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // USERS - Gestão de usuários por admin
  // ============================================================================

  /** Admin criou novo usuário */
  USER_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.USER,
    module: AuditModule.CORE,
    description: '{{adminName}} criou o usuário {{userName}}',
  } satisfies AuditMessage,

  /** Admin alterou email de outro usuário */
  USER_EMAIL_CHANGE: {
    action: AuditAction.EMAIL_CHANGE,
    entity: AuditEntity.USER_EMAIL,
    module: AuditModule.CORE,
    description:
      '{{adminName}} alterou o email de {{userName}} de {{oldEmail}} para {{newEmail}}',
  } satisfies AuditMessage,

  /** Admin alterou senha de outro usuário */
  USER_PASSWORD_CHANGE: {
    action: AuditAction.PASSWORD_CHANGE,
    entity: AuditEntity.USER_PASSWORD,
    module: AuditModule.CORE,
    description: '{{adminName}} alterou a senha de {{userName}}',
  } satisfies AuditMessage,

  /** Admin alterou username de outro usuário */
  USER_USERNAME_CHANGE: {
    action: AuditAction.USERNAME_CHANGE,
    entity: AuditEntity.USER_USERNAME,
    module: AuditModule.CORE,
    description:
      '{{adminName}} alterou o username de {{userName}} de {{oldUsername}} para {{newUsername}}',
  } satisfies AuditMessage,

  /** Admin atualizou perfil de outro usuário */
  USER_PROFILE_CHANGE: {
    action: AuditAction.PROFILE_CHANGE,
    entity: AuditEntity.USER_PROFILE,
    module: AuditModule.CORE,
    description: '{{adminName}} atualizou o perfil de {{userName}}',
  } satisfies AuditMessage,

  /** Admin forçou reset de senha de outro usuário */
  USER_FORCE_PASSWORD_RESET: {
    action: AuditAction.PASSWORD_FORCE_RESET,
    entity: AuditEntity.USER_PASSWORD,
    module: AuditModule.CORE,
    description:
      '{{adminName}} solicitou reset de senha obrigatório para {{userName}}: {{reason}}',
  } satisfies AuditMessage,

  /** Admin forçou reset de PIN de acesso de outro usuário */
  USER_FORCE_ACCESS_PIN_RESET: {
    action: AuditAction.PIN_FORCE_RESET,
    entity: AuditEntity.USER_ACCESS_PIN,
    module: AuditModule.CORE,
    description:
      '{{adminName}} solicitou reset de PIN de acesso obrigatório para {{userName}}',
  } satisfies AuditMessage,

  /** Admin forçou reset de PIN de ação de outro usuário */
  USER_FORCE_ACTION_PIN_RESET: {
    action: AuditAction.PIN_FORCE_RESET,
    entity: AuditEntity.USER_ACTION_PIN,
    module: AuditModule.CORE,
    description:
      '{{adminName}} solicitou reset de PIN de autorização obrigatório para {{userName}}',
  } satisfies AuditMessage,

  /** Admin excluiu usuário */
  USER_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.USER,
    module: AuditModule.CORE,
    description: '{{adminName}} excluiu o usuário {{userName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // LABEL_TEMPLATES - Gestão de templates de etiquetas
  // ============================================================================

  /** Criou template de etiqueta */
  LABEL_TEMPLATE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.LABEL_TEMPLATE,
    module: AuditModule.CORE,
    description: '{{userName}} criou o template de etiqueta {{templateName}}',
  } satisfies AuditMessage,

  /** Atualizou template de etiqueta */
  LABEL_TEMPLATE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.LABEL_TEMPLATE,
    module: AuditModule.CORE,
    description:
      '{{userName}} atualizou o template de etiqueta {{templateName}}',
  } satisfies AuditMessage,

  /** Excluiu template de etiqueta */
  LABEL_TEMPLATE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.LABEL_TEMPLATE,
    module: AuditModule.CORE,
    description: '{{userName}} excluiu o template de etiqueta {{templateName}}',
  } satisfies AuditMessage,

  /** Duplicou template de etiqueta */
  LABEL_TEMPLATE_DUPLICATE: {
    action: AuditAction.DUPLICATE,
    entity: AuditEntity.LABEL_TEMPLATE,
    module: AuditModule.CORE,
    description:
      '{{userName}} duplicou o template de etiqueta {{sourceTemplateName}} como {{newTemplateName}}',
  } satisfies AuditMessage,

  /** Gerou thumbnail de template de etiqueta */
  LABEL_TEMPLATE_THUMBNAIL_GENERATE: {
    action: AuditAction.GENERATE,
    entity: AuditEntity.LABEL_TEMPLATE,
    module: AuditModule.CORE,
    description:
      '{{userName}} gerou thumbnail para o template de etiqueta {{templateName}}',
  } satisfies AuditMessage,

  /** Enviou imagem para template de etiqueta */
  LABEL_TEMPLATE_IMAGE_UPLOAD: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.LABEL_TEMPLATE,
    module: AuditModule.CORE,
    description:
      '{{userName}} enviou imagem para o template de etiqueta {{templateName}}',
  } satisfies AuditMessage,
  // ============================================================================
  // TEAMS - Gestão de equipes
  // ============================================================================

  /** Criou uma equipe */
  TEAM_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.TEAM,
    module: AuditModule.CORE,
    description: '{{userName}} criou a equipe {{teamName}}',
  } satisfies AuditMessage,

  /** Atualizou informações da equipe */
  TEAM_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.TEAM,
    module: AuditModule.CORE,
    description: '{{userName}} atualizou a equipe {{teamName}}',
  } satisfies AuditMessage,

  /** Excluiu uma equipe */
  TEAM_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.TEAM,
    module: AuditModule.CORE,
    description: '{{userName}} excluiu a equipe {{teamName}}',
  } satisfies AuditMessage,

  /** Adicionou um membro à equipe */
  TEAM_MEMBER_ADD: {
    action: AuditAction.MEMBER_ADD,
    entity: AuditEntity.TEAM_MEMBER,
    module: AuditModule.CORE,
    description: '{{userName}} adicionou {{memberName}} à equipe {{teamName}}',
  } satisfies AuditMessage,

  /** Adicionou múltiplos membros à equipe */
  TEAM_MEMBERS_BULK_ADD: {
    action: AuditAction.MEMBER_ADD,
    entity: AuditEntity.TEAM_MEMBER,
    module: AuditModule.CORE,
    description:
      '{{userName}} adicionou {{count}} membros à equipe {{teamName}}',
  } satisfies AuditMessage,

  /** Removeu um membro da equipe */
  TEAM_MEMBER_REMOVE: {
    action: AuditAction.MEMBER_REMOVE,
    entity: AuditEntity.TEAM_MEMBER,
    module: AuditModule.CORE,
    description: '{{userName}} removeu {{memberName}} da equipe {{teamName}}',
  } satisfies AuditMessage,

  /** Alterou o papel de um membro */
  TEAM_MEMBER_ROLE_CHANGE: {
    action: AuditAction.ROLE_CHANGE,
    entity: AuditEntity.TEAM_MEMBER,
    module: AuditModule.CORE,
    description:
      '{{userName}} alterou o papel de {{memberName}} de {{oldRole}} para {{newRole}} na equipe {{teamName}}',
  } satisfies AuditMessage,

  /** Transferiu a propriedade da equipe */
  TEAM_OWNERSHIP_TRANSFER: {
    action: AuditAction.OWNERSHIP_TRANSFER,
    entity: AuditEntity.TEAM,
    module: AuditModule.CORE,
    description:
      '{{userName}} transferiu a propriedade da equipe {{teamName}} para {{newOwnerName}}',
  } satisfies AuditMessage,
} as const;

export type CoreAuditMessageKey = keyof typeof CORE_AUDIT_MESSAGES;
