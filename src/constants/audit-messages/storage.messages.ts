import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import type { AuditMessage } from './types';

export const STORAGE_AUDIT_MESSAGES = {
  // ============================================================================
  // FOLDERS - Pastas
  // ============================================================================

  FOLDER_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.STORAGE_FOLDER,
    module: AuditModule.STORAGE,
    description: '{{userName}} criou a pasta {{folderName}}',
  } satisfies AuditMessage,

  FOLDER_RENAME: {
    action: AuditAction.FOLDER_RENAME,
    entity: AuditEntity.STORAGE_FOLDER,
    module: AuditModule.STORAGE,
    description:
      '{{userName}} renomeou a pasta de {{oldName}} para {{newName}}',
  } satisfies AuditMessage,

  FOLDER_MOVE: {
    action: AuditAction.FOLDER_MOVE,
    entity: AuditEntity.STORAGE_FOLDER,
    module: AuditModule.STORAGE,
    description:
      '{{userName}} moveu a pasta {{folderName}} para {{targetPath}}',
  } satisfies AuditMessage,

  FOLDER_INITIALIZE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.STORAGE_FOLDER,
    module: AuditModule.STORAGE,
    description:
      '{{userName}} inicializou as pastas do sistema ({{folderCount}} pastas criadas)',
  } satisfies AuditMessage,

  FOLDER_ENSURE_ENTITY: {
    action: AuditAction.CREATE,
    entity: AuditEntity.STORAGE_FOLDER,
    module: AuditModule.STORAGE,
    description:
      '{{userName}} criou pastas para {{entityType}} "{{entityName}}"',
  } satisfies AuditMessage,

  FOLDER_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.STORAGE_FOLDER,
    module: AuditModule.STORAGE,
    description: '{{userName}} excluiu a pasta {{folderName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // FILES - Arquivos
  // ============================================================================

  FILE_UPLOAD: {
    action: AuditAction.FILE_UPLOAD,
    entity: AuditEntity.STORAGE_FILE,
    module: AuditModule.STORAGE,
    description:
      '{{userName}} enviou o arquivo {{fileName}} para {{folderName}}',
  } satisfies AuditMessage,

  FILE_RENAME: {
    action: AuditAction.FILE_RENAME,
    entity: AuditEntity.STORAGE_FILE,
    module: AuditModule.STORAGE,
    description:
      '{{userName}} renomeou o arquivo de {{oldName}} para {{newName}}',
  } satisfies AuditMessage,

  FILE_MOVE: {
    action: AuditAction.FILE_MOVE,
    entity: AuditEntity.STORAGE_FILE,
    module: AuditModule.STORAGE,
    description:
      '{{userName}} moveu o arquivo {{fileName}} para {{targetFolder}}',
  } satisfies AuditMessage,

  FILE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.STORAGE_FILE,
    module: AuditModule.STORAGE,
    description: '{{userName}} excluiu o arquivo {{fileName}}',
  } satisfies AuditMessage,

  FILE_DOWNLOAD: {
    action: AuditAction.FILE_DOWNLOAD,
    entity: AuditEntity.STORAGE_FILE,
    module: AuditModule.STORAGE,
    description: '{{userName}} baixou o arquivo {{fileName}}',
  } satisfies AuditMessage,

  FILE_ACCESS: {
    action: AuditAction.FILE_ACCESS,
    entity: AuditEntity.STORAGE_FILE,
    module: AuditModule.STORAGE,
    description: '{{userName}} acessou o arquivo {{fileName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // FILE VERSIONS - Versoes de Arquivos
  // ============================================================================

  FILE_VERSION_UPLOAD: {
    action: AuditAction.FILE_VERSION_UPLOAD,
    entity: AuditEntity.STORAGE_FILE_VERSION,
    module: AuditModule.STORAGE,
    description:
      '{{userName}} enviou a versao {{versionNumber}} do arquivo {{fileName}}',
  } satisfies AuditMessage,

  FILE_VERSION_RESTORE: {
    action: AuditAction.FILE_VERSION_RESTORE,
    entity: AuditEntity.STORAGE_FILE_VERSION,
    module: AuditModule.STORAGE,
    description:
      '{{userName}} restaurou o arquivo {{fileName}} para a versao {{versionNumber}}',
  } satisfies AuditMessage,

  // ============================================================================
  // ACCESS - Controle de Acesso
  // ============================================================================

  ACCESS_GRANT: {
    action: AuditAction.ACCESS_GRANT,
    entity: AuditEntity.FOLDER_ACCESS_RULE,
    module: AuditModule.STORAGE,
    description: '{{userName}} concedeu acesso a pasta {{folderName}}',
  } satisfies AuditMessage,

  ACCESS_REVOKE: {
    action: AuditAction.ACCESS_REVOKE,
    entity: AuditEntity.FOLDER_ACCESS_RULE,
    module: AuditModule.STORAGE,
    description: '{{userName}} revogou acesso a pasta {{folderName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // BULK - Operações em Lote
  // ============================================================================

  BULK_MOVE: {
    action: AuditAction.BULK_MOVE,
    entity: AuditEntity.STORAGE_FILE,
    module: AuditModule.STORAGE,
    description:
      '{{userName}} moveu {{fileCount}} arquivos e {{folderCount}} pastas para {{targetFolder}}',
  } satisfies AuditMessage,

  BULK_DELETE: {
    action: AuditAction.BULK_DELETE,
    entity: AuditEntity.STORAGE_FILE,
    module: AuditModule.STORAGE,
    description:
      '{{userName}} excluiu {{fileCount}} arquivos e {{folderCount}} pastas',
  } satisfies AuditMessage,

  // ============================================================================
  // SHARING - Compartilhamento
  // ============================================================================

  SHARE_LINK_CREATED: {
    action: AuditAction.CREATE,
    entity: AuditEntity.STORAGE_FILE,
    module: AuditModule.STORAGE,
    description:
      '{{userName}} criou um link de compartilhamento para o arquivo {{fileName}}',
  } satisfies AuditMessage,

  SHARE_LINK_REVOKED: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.STORAGE_FILE,
    module: AuditModule.STORAGE,
    description:
      '{{userName}} revogou um link de compartilhamento para o arquivo {{fileName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // SECURITY - Segurança (Proteção por Senha)
  // ============================================================================

  ITEM_PROTECT: {
    action: AuditAction.ITEM_PROTECT,
    entity: AuditEntity.STORAGE_FILE,
    module: AuditModule.STORAGE,
    description: '{{userName}} protegeu o {{itemType}} {{itemName}} com senha',
  } satisfies AuditMessage,

  ITEM_UNPROTECT: {
    action: AuditAction.ITEM_UNPROTECT,
    entity: AuditEntity.STORAGE_FILE,
    module: AuditModule.STORAGE,
    description:
      '{{userName}} removeu a proteção por senha do {{itemType}} {{itemName}}',
  } satisfies AuditMessage,

  ITEM_HIDE: {
    action: AuditAction.ITEM_HIDE,
    entity: AuditEntity.STORAGE_FILE,
    module: AuditModule.STORAGE,
    description: '{{userName}} ocultou o {{itemType}} {{itemName}}',
  } satisfies AuditMessage,

  ITEM_UNHIDE: {
    action: AuditAction.ITEM_UNHIDE,
    entity: AuditEntity.STORAGE_FILE,
    module: AuditModule.STORAGE,
    description: '{{userName}} revelou o {{itemType}} {{itemName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // TRASH - Lixeira
  // ============================================================================

  EMPTY_TRASH: {
    action: AuditAction.DELETE,
    entity: AuditEntity.STORAGE_FILE,
    module: AuditModule.STORAGE,
    description: '{{userName}} esvaziou a lixeira',
  } satisfies AuditMessage,
} as const;
