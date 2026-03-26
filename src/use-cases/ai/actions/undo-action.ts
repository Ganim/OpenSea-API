import { prisma } from '@/lib/prisma';
import type { AiActionLogsRepository } from '@/repositories/ai/ai-action-logs-repository';
import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { AuditLogsRepository } from '@/repositories/audit/audit-logs-repository';

// ── Entity type mapping (AI tool entity type -> AuditEntity enum) ─────

const ENTITY_TYPE_TO_AUDIT_ENTITY: Record<string, AuditEntity> = {
  product: AuditEntity.PRODUCT,
  variant: AuditEntity.VARIANT,
  item: AuditEntity.ITEM,
  category: AuditEntity.CATEGORY,
  tag: AuditEntity.TAG,
  supplier: AuditEntity.SUPPLIER,
  manufacturer: AuditEntity.MANUFACTURER,
  warehouse: AuditEntity.LOCATION,
  template: AuditEntity.TEMPLATE,
  'stock-movement': AuditEntity.ITEM_MOVEMENT,
  'purchase-order': AuditEntity.PURCHASE_ORDER,
  employee: AuditEntity.EMPLOYEE,
  department: AuditEntity.DEPARTMENT,
  position: AuditEntity.POSITION,
  absence: AuditEntity.ABSENCE,
  vacation: AuditEntity.VACATION_PERIOD,
  'financial-entry': AuditEntity.FINANCE_ENTRY,
  'cost-center': AuditEntity.COST_CENTER,
  'bank-account': AuditEntity.BANK_ACCOUNT,
  'finance-category': AuditEntity.FINANCE_CATEGORY,
  customer: AuditEntity.CUSTOMER,
  order: AuditEntity.SALES_ORDER,
  reservation: AuditEntity.ITEM_RESERVATION,
};

// ── AuditEntity -> Prisma model name mapping ─────────────────────────

const ENTITY_TO_PRISMA: Record<string, string> = {
  PRODUCT: 'product',
  VARIANT: 'variant',
  ITEM: 'item',
  CATEGORY: 'category',
  TAG: 'tag',
  SUPPLIER: 'supplier',
  MANUFACTURER: 'manufacturer',
  LOCATION: 'location',
  TEMPLATE: 'template',
  ITEM_MOVEMENT: 'itemMovement',
  PURCHASE_ORDER: 'purchaseOrder',
  EMPLOYEE: 'employee',
  DEPARTMENT: 'department',
  POSITION: 'position',
  WORK_SCHEDULE: 'workSchedule',
  ABSENCE: 'absence',
  VACATION_PERIOD: 'vacationPeriod',
  COST_CENTER: 'costCenter',
  BANK_ACCOUNT: 'bankAccount',
  FINANCE_ENTRY: 'financeEntry',
  FINANCE_CATEGORY: 'financeCategory',
  CUSTOMER: 'customer',
  SALES_ORDER: 'salesOrder',
  SALES_ORDER_ITEM: 'salesOrderItem',
  ITEM_RESERVATION: 'itemReservation',
};

// ── Fields that should never be restored during undo ──────────────────

const UNDO_EXCLUDED_FIELDS = new Set([
  'id',
  'tenantId',
  'tenant_id',
  'createdAt',
  'created_at',
  'updatedAt',
  'updated_at',
  '_placeholders',
]);

interface UndoActionRequest {
  actionLogId: string;
  tenantId: string;
  userId: string;
}

interface UndoActionResponse {
  success: boolean;
  message: string;
  undoneActionId: string;
  entityType: string;
  entityId: string | null;
  originalAction: string;
}

export class UndoActionUseCase {
  constructor(
    private actionLogsRepository: AiActionLogsRepository,
    private auditLogsRepository: AuditLogsRepository,
  ) {}

  async execute(request: UndoActionRequest): Promise<UndoActionResponse> {
    const { actionLogId, tenantId, userId } = request;

    // 1. Find the AiActionLog
    const actionLog = await this.actionLogsRepository.findById(actionLogId);

    if (!actionLog) {
      throw new Error('Ação não encontrada.');
    }

    if (actionLog.tenantId !== tenantId) {
      throw new Error('Ação não pertence a este tenant.');
    }

    if (actionLog.status !== 'EXECUTED') {
      throw new Error(
        `Apenas ações executadas podem ser desfeitas. Status atual: ${actionLog.status}`,
      );
    }

    if (!actionLog.targetEntityId) {
      throw new Error(
        'Não é possível desfazer esta ação: entidade alvo não identificada.',
      );
    }

    // 2. Resolve the AuditEntity from the action log's entity type
    const auditEntity = ENTITY_TYPE_TO_AUDIT_ENTITY[actionLog.targetEntityType];
    if (!auditEntity) {
      throw new Error(
        `Tipo de entidade "${actionLog.targetEntityType}" não suportado para undo.`,
      );
    }

    // 3. Resolve the Prisma model name
    const prismaModel = ENTITY_TO_PRISMA[auditEntity];
    if (!prismaModel) {
      throw new Error(
        `Modelo Prisma não mapeado para entidade "${auditEntity}".`,
      );
    }

    // 4. Find the linked AuditLog (via auditLogId or by querying)
    let auditLogAction: AuditAction | null = null;
    let oldData: Record<string, unknown> | null = null;

    if (actionLog.auditLogId) {
      const auditLog = await this.auditLogsRepository.findById(
        new UniqueEntityID(actionLog.auditLogId),
      );
      if (auditLog) {
        auditLogAction = auditLog.action;
        oldData = auditLog.oldData;
      }
    }

    // Fallback: query the most recent AuditLog for this entity
    if (!auditLogAction) {
      const recentLogs = await this.auditLogsRepository.listByEntity(
        auditEntity,
        actionLog.targetEntityId,
        {
          tenantId: new UniqueEntityID(tenantId),
          limit: 1,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      );

      if (recentLogs.length > 0) {
        const mostRecent = recentLogs[0];
        auditLogAction = mostRecent.action;
        oldData = mostRecent.oldData;
      }
    }

    // If still no audit log found, infer from tool name
    if (!auditLogAction) {
      auditLogAction = this.inferActionFromToolName(actionLog.actionType);
    }

    // 5. Verify the entity still exists before undoing
    const entityExists = await this.entityExists(
      prismaModel,
      actionLog.targetEntityId,
    );

    if (!entityExists && auditLogAction !== AuditAction.DELETE) {
      throw new Error(
        'A entidade não existe mais no banco de dados. Não é possível desfazer.',
      );
    }

    // 6. Perform the undo based on the original action type
    let undoDescription: string;

    switch (auditLogAction) {
      case AuditAction.CREATE: {
        // Undo CREATE = soft delete
        await this.softDeleteEntity(prismaModel, actionLog.targetEntityId);
        undoDescription = `Criação desfeita: entidade ${auditEntity} (${actionLog.targetEntityId}) removida via soft delete.`;
        break;
      }

      case AuditAction.UPDATE: {
        // Undo UPDATE = restore old values
        if (!oldData) {
          throw new Error(
            'Não é possível desfazer a atualização: dados anteriores não encontrados no log de auditoria.',
          );
        }

        const restoreData = this.buildRestoreData(oldData);
        if (Object.keys(restoreData).length === 0) {
          throw new Error('Não há campos para restaurar nos dados anteriores.');
        }

        await this.updateEntity(
          prismaModel,
          actionLog.targetEntityId,
          restoreData,
        );
        undoDescription = `Atualização desfeita: campos restaurados para valores anteriores em ${auditEntity} (${actionLog.targetEntityId}).`;
        break;
      }

      case AuditAction.DELETE: {
        // Undo DELETE = restore (un-soft-delete)
        await this.restoreEntity(prismaModel, actionLog.targetEntityId);
        undoDescription = `Exclusão desfeita: entidade ${auditEntity} (${actionLog.targetEntityId}) restaurada.`;
        break;
      }

      default: {
        throw new Error(
          `Tipo de ação "${auditLogAction}" não pode ser desfeito automaticamente.`,
        );
      }
    }

    // 7. Mark the AiActionLog as UNDONE
    await this.actionLogsRepository.updateStatus(actionLogId, 'UNDONE');

    // 8. Create audit log for the undo operation itself
    try {
      await this.auditLogsRepository.log({
        action: AuditAction.RESTORE,
        entity: auditEntity,
        module: this.getModuleFromEntity(auditEntity),
        entityId: actionLog.targetEntityId,
        description: `[AI Undo] ${undoDescription}`,
        oldData: null,
        newData: oldData,
        tenantId: new UniqueEntityID(tenantId),
        userId: new UniqueEntityID(userId),
        endpoint: '/ai/undo',
        method: 'UNDO',
      });
    } catch (error) {
      // Audit log failure should not break the undo operation
      console.error('[AI Undo] Failed to log audit for undo operation:', error);
    }

    return {
      success: true,
      message: undoDescription,
      undoneActionId: actionLogId,
      entityType: actionLog.targetEntityType,
      entityId: actionLog.targetEntityId,
      originalAction: actionLog.actionType,
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────

  private inferActionFromToolName(toolName: string): AuditAction {
    if (toolName.includes('create') || toolName.includes('register')) {
      return AuditAction.CREATE;
    }
    if (toolName.includes('update')) {
      return AuditAction.UPDATE;
    }
    if (toolName.includes('delete') || toolName.includes('cancel')) {
      return AuditAction.DELETE;
    }
    return AuditAction.OTHER;
  }

  private buildRestoreData(
    oldData: Record<string, unknown>,
  ): Record<string, unknown> {
    const restoreData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(oldData)) {
      if (UNDO_EXCLUDED_FIELDS.has(key)) continue;
      if (value === '[REDACTED]') continue;
      restoreData[key] = value;
    }

    return restoreData;
  }

  private async entityExists(
    modelName: string,
    entityId: string,
  ): Promise<boolean> {
    try {
      const result = await (prisma as any)[modelName].findUnique({
        where: { id: entityId },
        select: { id: true },
      });
      return result !== null;
    } catch {
      return false;
    }
  }

  private async softDeleteEntity(
    modelName: string,
    entityId: string,
  ): Promise<void> {
    try {
      await (prisma as any)[modelName].update({
        where: { id: entityId },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      throw new Error(
        `Falha ao remover entidade: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
      );
    }
  }

  private async updateEntity(
    modelName: string,
    entityId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    try {
      await (prisma as any)[modelName].update({
        where: { id: entityId },
        data,
      });
    } catch (error) {
      throw new Error(
        `Falha ao restaurar dados da entidade: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
      );
    }
  }

  private async restoreEntity(
    modelName: string,
    entityId: string,
  ): Promise<void> {
    try {
      await (prisma as any)[modelName].update({
        where: { id: entityId },
        data: { deletedAt: null },
      });
    } catch (error) {
      throw new Error(
        `Falha ao restaurar entidade: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
      );
    }
  }

  private getModuleFromEntity(entity: AuditEntity): any {
    // Import dynamically to avoid circular deps
    const { AuditModule } = require('@/entities/audit/audit-module.enum');

    const stockEntities = [
      AuditEntity.PRODUCT,
      AuditEntity.VARIANT,
      AuditEntity.ITEM,
      AuditEntity.CATEGORY,
      AuditEntity.SUPPLIER,
      AuditEntity.MANUFACTURER,
      AuditEntity.LOCATION,
      AuditEntity.TEMPLATE,
      AuditEntity.ITEM_MOVEMENT,
      AuditEntity.TAG,
      AuditEntity.PURCHASE_ORDER,
    ];
    if (stockEntities.includes(entity)) return AuditModule.STOCK;

    const hrEntities = [
      AuditEntity.EMPLOYEE,
      AuditEntity.DEPARTMENT,
      AuditEntity.POSITION,
      AuditEntity.ABSENCE,
      AuditEntity.VACATION_PERIOD,
      AuditEntity.WORK_SCHEDULE,
    ];
    if (hrEntities.includes(entity)) return AuditModule.HR;

    const financeEntities = [
      AuditEntity.FINANCE_ENTRY,
      AuditEntity.COST_CENTER,
      AuditEntity.BANK_ACCOUNT,
      AuditEntity.FINANCE_CATEGORY,
    ];
    if (financeEntities.includes(entity)) return AuditModule.FINANCE;

    const salesEntities = [
      AuditEntity.CUSTOMER,
      AuditEntity.SALES_ORDER,
      AuditEntity.ITEM_RESERVATION,
    ];
    if (salesEntities.includes(entity)) return AuditModule.SALES;

    return AuditModule.OTHER;
  }
}
