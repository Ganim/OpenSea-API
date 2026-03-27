import type { CadenceSequence } from '@/entities/sales/cadence-sequence';

export interface CadenceStepDTO {
  id: string;
  sequenceId: string;
  order: number;
  type: string;
  delayDays: number;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CadenceEnrollmentDTO {
  id: string;
  sequenceId: string;
  tenantId: string;
  contactId?: string;
  dealId?: string;
  currentStepOrder: number;
  status: string;
  nextActionAt?: Date;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface CadenceSequenceDTO {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  steps: CadenceStepDTO[];
  enrollmentCount?: number;
}

export function cadenceSequenceToDTO(
  cadenceSequence: CadenceSequence,
): CadenceSequenceDTO {
  const dto: CadenceSequenceDTO = {
    id: cadenceSequence.id.toString(),
    tenantId: cadenceSequence.tenantId.toString(),
    name: cadenceSequence.name,
    isActive: cadenceSequence.isActive,
    createdBy: cadenceSequence.createdBy,
    createdAt: cadenceSequence.createdAt,
    steps: cadenceSequence.steps.map((step) => ({
      id: step.id.toString(),
      sequenceId: step.sequenceId.toString(),
      order: step.order,
      type: step.type,
      delayDays: step.delayDays,
      config: step.config,
      createdAt: step.createdAt,
      ...(step.updatedAt && { updatedAt: step.updatedAt }),
    })),
  };

  if (cadenceSequence.description)
    dto.description = cadenceSequence.description;
  if (cadenceSequence.updatedAt) dto.updatedAt = cadenceSequence.updatedAt;
  if (cadenceSequence.deletedAt) dto.deletedAt = cadenceSequence.deletedAt;
  if (cadenceSequence.enrollmentCount !== undefined) {
    dto.enrollmentCount = cadenceSequence.enrollmentCount;
  }

  return dto;
}

export function cadenceEnrollmentToDTO(
  enrollment: import('@/entities/sales/cadence-sequence').CadenceEnrollmentProps,
): CadenceEnrollmentDTO {
  const dto: CadenceEnrollmentDTO = {
    id: enrollment.id.toString(),
    sequenceId: enrollment.sequenceId.toString(),
    tenantId: enrollment.tenantId.toString(),
    currentStepOrder: enrollment.currentStepOrder,
    status: enrollment.status,
    startedAt: enrollment.startedAt,
    createdAt: enrollment.createdAt,
  };

  if (enrollment.contactId) dto.contactId = enrollment.contactId;
  if (enrollment.dealId) dto.dealId = enrollment.dealId;
  if (enrollment.nextActionAt) dto.nextActionAt = enrollment.nextActionAt;
  if (enrollment.completedAt) dto.completedAt = enrollment.completedAt;

  return dto;
}
