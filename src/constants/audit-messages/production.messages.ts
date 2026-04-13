import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import type { AuditMessage } from './types';

/**
 * Mensagens de auditoria do módulo PRODUCTION
 *
 * Inclui: WorkstationTypes, Workstations, WorkCenters, BOMs, OperationRoutings,
 * ProductionOrders, JobCards, DowntimeReasons, Schedules, Quality, Costing
 */
export const PRODUCTION_AUDIT_MESSAGES = {
  // ============================================================================
  // WORKSTATION TYPES
  // ============================================================================

  WORKSTATION_TYPE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.WORKSTATION_TYPE,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} criou o tipo de posto de trabalho {{name}}',
  } satisfies AuditMessage,

  WORKSTATION_TYPE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.WORKSTATION_TYPE,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} atualizou o tipo de posto de trabalho {{name}}',
  } satisfies AuditMessage,

  WORKSTATION_TYPE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.WORKSTATION_TYPE,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} removeu o tipo de posto de trabalho {{name}}',
  } satisfies AuditMessage,

  // ============================================================================
  // WORKSTATIONS
  // ============================================================================

  WORKSTATION_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.WORKSTATION,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} criou o posto de trabalho {{name}} ({{code}})',
  } satisfies AuditMessage,

  WORKSTATION_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.WORKSTATION,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} atualizou o posto de trabalho {{name}}',
  } satisfies AuditMessage,

  WORKSTATION_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.WORKSTATION,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} removeu o posto de trabalho {{name}}',
  } satisfies AuditMessage,

  // ============================================================================
  // WORK CENTERS
  // ============================================================================

  WORK_CENTER_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.WORK_CENTER,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} criou o centro de trabalho {{name}} ({{code}})',
  } satisfies AuditMessage,

  WORK_CENTER_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.WORK_CENTER,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} atualizou o centro de trabalho {{name}}',
  } satisfies AuditMessage,

  WORK_CENTER_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.WORK_CENTER,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} removeu o centro de trabalho {{name}}',
  } satisfies AuditMessage,

  // ============================================================================
  // BILL OF MATERIALS
  // ============================================================================

  BOM_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PRODUCTION_BOM,
    module: AuditModule.PRODUCTION,
    description:
      '{{userName}} criou a lista de materiais {{name}} v{{version}}',
  } satisfies AuditMessage,

  BOM_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PRODUCTION_BOM,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} atualizou a lista de materiais {{name}}',
  } satisfies AuditMessage,

  BOM_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.PRODUCTION_BOM,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} removeu a lista de materiais {{name}}',
  } satisfies AuditMessage,

  BOM_APPROVE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PRODUCTION_BOM,
    module: AuditModule.PRODUCTION,
    description:
      '{{userName}} aprovou a lista de materiais {{name}} v{{version}}',
  } satisfies AuditMessage,

  // ============================================================================
  // BOM ITEMS
  // ============================================================================

  BOM_ITEM_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PRODUCTION_BOM_ITEM,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} adicionou material à lista de materiais',
  } satisfies AuditMessage,

  BOM_ITEM_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PRODUCTION_BOM_ITEM,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} atualizou item da lista de materiais',
  } satisfies AuditMessage,

  BOM_ITEM_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.PRODUCTION_BOM_ITEM,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} removeu item da lista de materiais',
  } satisfies AuditMessage,

  // ============================================================================
  // OPERATION ROUTING
  // ============================================================================

  OPERATION_ROUTING_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.OPERATION_ROUTING,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} criou a operação {{operationName}} no roteiro',
  } satisfies AuditMessage,

  OPERATION_ROUTING_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.OPERATION_ROUTING,
    module: AuditModule.PRODUCTION,
    description:
      '{{userName}} atualizou a operação {{operationName}} no roteiro',
  } satisfies AuditMessage,

  OPERATION_ROUTING_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.OPERATION_ROUTING,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} removeu a operação {{operationName}} do roteiro',
  } satisfies AuditMessage,

  // ============================================================================
  // PRODUCTION ORDERS
  // ============================================================================

  ORDER_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PRODUCTION_ORDER,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} criou a ordem de produção {{orderNumber}}',
  } satisfies AuditMessage,

  ORDER_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PRODUCTION_ORDER,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} atualizou a ordem de produção {{orderNumber}}',
  } satisfies AuditMessage,

  ORDER_STATUS_CHANGE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PRODUCTION_ORDER,
    module: AuditModule.PRODUCTION,
    description:
      '{{userName}} alterou o status da OP {{orderNumber}} de {{fromStatus}} para {{toStatus}}',
  } satisfies AuditMessage,

  ORDER_CANCEL: {
    action: AuditAction.DELETE,
    entity: AuditEntity.PRODUCTION_ORDER,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} cancelou a ordem de produção {{orderNumber}}',
  } satisfies AuditMessage,

  // ============================================================================
  // MATERIAL RESERVATIONS
  // ============================================================================

  MATERIAL_RESERVATION_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PRODUCTION_MATERIAL_RESERVATION,
    module: AuditModule.PRODUCTION,
    description:
      '{{userName}} criou reserva de material para a OP {{orderNumber}}',
  } satisfies AuditMessage,

  MATERIAL_RESERVATION_CANCEL: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PRODUCTION_MATERIAL_RESERVATION,
    module: AuditModule.PRODUCTION,
    description:
      '{{userName}} cancelou reserva de material da OP {{orderNumber}}',
  } satisfies AuditMessage,

  // ============================================================================
  // MATERIAL MOVEMENTS
  // ============================================================================

  MATERIAL_ISSUE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PRODUCTION_MATERIAL_ISSUE,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} requisitou material para a OP {{orderNumber}}',
  } satisfies AuditMessage,

  MATERIAL_RETURN: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PRODUCTION_MATERIAL_RETURN,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} devolveu material da OP {{orderNumber}}',
  } satisfies AuditMessage,

  // ============================================================================
  // JOB CARDS
  // ============================================================================

  JOB_CARD_START: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PRODUCTION_JOB_CARD,
    module: AuditModule.PRODUCTION,
    description:
      '{{userName}} iniciou o job card da operação {{operationName}}',
  } satisfies AuditMessage,

  JOB_CARD_COMPLETE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PRODUCTION_JOB_CARD,
    module: AuditModule.PRODUCTION,
    description:
      '{{userName}} concluiu o job card da operação {{operationName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // DOWNTIME
  // ============================================================================

  DOWNTIME_REASON_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.DOWNTIME_REASON,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} criou o motivo de parada {{name}}',
  } satisfies AuditMessage,

  DOWNTIME_REASON_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.DOWNTIME_REASON,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} atualizou o motivo de parada {{name}}',
  } satisfies AuditMessage,

  DOWNTIME_REASON_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.DOWNTIME_REASON,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} removeu o motivo de parada {{name}}',
  } satisfies AuditMessage,

  DOWNTIME_RECORD_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.DOWNTIME_RECORD,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} registrou parada no posto {{workstationName}}',
  } satisfies AuditMessage,

  DOWNTIME_RECORD_END: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.DOWNTIME_RECORD,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} encerrou parada no posto {{workstationName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // QUALITY
  // ============================================================================

  QUALITY_HOLD_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.QUALITY_HOLD,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} bloqueou a OP {{orderNumber}} por qualidade',
  } satisfies AuditMessage,

  QUALITY_HOLD_RELEASE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.QUALITY_HOLD,
    module: AuditModule.PRODUCTION,
    description:
      '{{userName}} liberou o bloqueio de qualidade da OP {{orderNumber}}',
  } satisfies AuditMessage,

  // ============================================================================
  // SCHEDULE
  // ============================================================================

  SCHEDULE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PRODUCTION_SCHEDULE,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} criou o cronograma {{name}}',
  } satisfies AuditMessage,

  SCHEDULE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PRODUCTION_SCHEDULE,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} atualizou o cronograma {{name}}',
  } satisfies AuditMessage,

  // ============================================================================
  // DEFECT TYPES
  // ============================================================================

  DEFECT_TYPE_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.DEFECT_TYPE,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} criou o tipo de defeito {{name}}',
  } satisfies AuditMessage,

  DEFECT_TYPE_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.DEFECT_TYPE,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} atualizou o tipo de defeito {{name}}',
  } satisfies AuditMessage,

  DEFECT_TYPE_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.DEFECT_TYPE,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} removeu o tipo de defeito {{name}}',
  } satisfies AuditMessage,

  // ============================================================================
  // INSPECTION RESULTS
  // ============================================================================

  INSPECTION_RESULT_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.INSPECTION_RESULT,
    module: AuditModule.PRODUCTION,
    description:
      '{{userName}} registrou resultado de inspeção na OP {{orderNumber}}',
  } satisfies AuditMessage,

  INSPECTION_RESULT_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.INSPECTION_RESULT,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} atualizou resultado de inspeção para {{status}}',
  } satisfies AuditMessage,

  // ============================================================================
  // DEFECT RECORDS
  // ============================================================================

  DEFECT_RECORD_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.DEFECT_RECORD,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} registrou defeito {{defectTypeName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // COSTING
  // ============================================================================

  COST_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PRODUCTION_COST,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} registrou custo {{costType}} na OP {{orderId}}',
  } satisfies AuditMessage,

  COST_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PRODUCTION_COST,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} atualizou custo {{costType}} na OP {{orderId}}',
  } satisfies AuditMessage,

  // ============================================================================
  // TEXTILE — Confecção / Vestuário
  // ============================================================================

  TEXTILE_CUT_PLAN_GENERATE: {
    action: AuditAction.GENERATE,
    entity: AuditEntity.PRODUCTION_TEXTILE_CUT_PLAN,
    module: AuditModule.PRODUCTION,
    description:
      '{{userName}} gerou plano de corte para a OP {{orderNumber}} ({{totalPieces}} peças)',
  } satisfies AuditMessage,

  TEXTILE_BUNDLE_TICKETS_GENERATE: {
    action: AuditAction.GENERATE,
    entity: AuditEntity.PRODUCTION_TEXTILE_BUNDLE_TICKET,
    module: AuditModule.PRODUCTION,
    description:
      '{{userName}} gerou {{totalBundles}} tickets de pacote para a OP {{orderNumber}}',
  } satisfies AuditMessage,

  // ============================================================================
  // TIME ENTRIES
  // ============================================================================

  TIME_ENTRY_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PRODUCTION_TIME_ENTRY,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} registrou tempo no job card',
  } satisfies AuditMessage,

  TIME_ENTRY_END: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PRODUCTION_TIME_ENTRY,
    module: AuditModule.PRODUCTION,
    description: '{{userName}} encerrou registro de tempo',
  } satisfies AuditMessage,

  // ============================================================================
  // PRODUCTION ENTRIES
  // ============================================================================

  PRODUCTION_ENTRY_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PRODUCTION_ENTRY,
    module: AuditModule.PRODUCTION,
    description:
      '{{userName}} apontou produção no job card ({{quantityGood}} boas, {{quantityScrapped}} refugo)',
  } satisfies AuditMessage,
};
