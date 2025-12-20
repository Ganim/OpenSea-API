import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditLog } from '@/entities/audit/audit-log';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import { AuditLogsRepository } from '@/repositories/audit/audit-logs-repository';

interface LogAuditUseCaseRequest {
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  oldData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
  userId?: string | null;
  affectedUser?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  endpoint?: string | null;
  method?: string | null;
  description?: string | null;
}

export class LogAuditUseCase {
  constructor(private auditLogsRepository: AuditLogsRepository) {}

  // Mapeamento automático de entidade para módulo
  private getModuleFromEntity(entity: AuditEntity): AuditModule {
    if (
      [
        AuditEntity.USER,
        AuditEntity.USER_PROFILE,
        AuditEntity.SESSION,
        AuditEntity.REFRESH_TOKEN,
      ].includes(entity)
    ) {
      return AuditModule.CORE;
    }

    if (
      [
        AuditEntity.PERMISSION,
        AuditEntity.PERMISSION_GROUP,
        AuditEntity.PERMISSION_GROUP_PERMISSION,
        AuditEntity.USER_PERMISSION_GROUP,
        AuditEntity.USER_DIRECT_PERMISSION,
      ].includes(entity)
    ) {
      return AuditModule.RBAC;
    }

    if (
      [
        AuditEntity.PRODUCT,
        AuditEntity.VARIANT,
        AuditEntity.ITEM,
        AuditEntity.CATEGORY,
        AuditEntity.SUPPLIER,
        AuditEntity.MANUFACTURER,
        AuditEntity.LOCATION,
        AuditEntity.TEMPLATE,
        AuditEntity.ITEM_MOVEMENT,
        AuditEntity.PRODUCT_CATEGORY,
        AuditEntity.VARIANT_PRICE_HISTORY,
        AuditEntity.TAG,
        AuditEntity.PRODUCT_TAG,
        AuditEntity.VARIANT_IMAGE,
        AuditEntity.PURCHASE_ORDER,
        AuditEntity.PURCHASE_ORDER_ITEM,
        AuditEntity.UNIT_CONVERSION,
        AuditEntity.STOCK_SNAPSHOT,
        AuditEntity.VARIANT_SUPPLIER_CODE,
        AuditEntity.VARIANT_PROMOTION,
      ].includes(entity)
    ) {
      return AuditModule.STOCK;
    }

    if (
      [
        AuditEntity.CUSTOMER,
        AuditEntity.SALES_ORDER,
        AuditEntity.SALES_ORDER_ITEM,
        AuditEntity.ITEM_RESERVATION,
        AuditEntity.COMMENT,
      ].includes(entity)
    ) {
      return AuditModule.SALES;
    }

    if (
      [
        AuditEntity.ALERT,
        AuditEntity.NOTIFICATION,
        AuditEntity.NOTIFICATION_TEMPLATE,
        AuditEntity.NOTIFICATION_PREFERENCE,
      ].includes(entity)
    ) {
      return AuditModule.NOTIFICATIONS;
    }

    if (
      [
        AuditEntity.REQUEST,
        AuditEntity.REQUEST_ATTACHMENT,
        AuditEntity.REQUEST_COMMENT,
        AuditEntity.REQUEST_HISTORY,
      ].includes(entity)
    ) {
      return AuditModule.REQUESTS;
    }

    if (
      [
        AuditEntity.EMPLOYEE,
        AuditEntity.DEPARTMENT,
        AuditEntity.POSITION,
        AuditEntity.TIME_ENTRY,
        AuditEntity.WORK_SCHEDULE,
        AuditEntity.OVERTIME,
        AuditEntity.TIME_BANK,
        AuditEntity.ABSENCE,
        AuditEntity.VACATION_PERIOD,
      ].includes(entity)
    ) {
      return AuditModule.HR;
    }

    if (
      [
        AuditEntity.PAYROLL,
        AuditEntity.PAYROLL_ITEM,
        AuditEntity.BONUS,
        AuditEntity.DEDUCTION,
      ].includes(entity)
    ) {
      return AuditModule.PAYROLL;
    }

    return AuditModule.OTHER;
  }

  // Sanitiza dados sensíveis
  private sanitizeData(
    data: Record<string, any> | null,
  ): Record<string, any> | null {
    if (!data) return null;

    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
      'secret',
      'privateKey',
      'creditCard',
      'cvv',
      'ssn',
    ];

    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  async execute(request: LogAuditUseCaseRequest): Promise<void> {
    const {
      action,
      entity,
      entityId,
      oldData,
      newData,
      userId,
      affectedUser,
      ip,
      userAgent,
      endpoint,
      method,
      description,
    } = request;

    try {
      const module = this.getModuleFromEntity(entity);
      const sanitizedOldData = this.sanitizeData(oldData || null);
      const sanitizedNewData = this.sanitizeData(newData || null);

      const auditLog = AuditLog.create({
        action,
        entity,
        module,
        entityId,
        oldData: sanitizedOldData,
        newData: sanitizedNewData,
        userId,
        affectedUser,
        ip,
        userAgent,
        endpoint,
        method,
        description,
      });

      await this.auditLogsRepository.log(auditLog);
    } catch (error) {
      // Não propagar erros de auditoria para não interromper operação principal
      console.error('[AUDIT] Failed to log audit:', error);
    }
  }
}
