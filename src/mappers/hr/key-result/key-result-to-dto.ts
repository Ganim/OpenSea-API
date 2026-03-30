import type { KeyResult } from '@/entities/hr/key-result';

export interface KeyResultDTO {
  id: string;
  objectiveId: string;
  title: string;
  description: string | null;
  type: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string | null;
  status: string;
  weight: number;
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export function keyResultToDTO(keyResult: KeyResult): KeyResultDTO {
  return {
    id: keyResult.id.toString(),
    objectiveId: keyResult.objectiveId.toString(),
    title: keyResult.title,
    description: keyResult.description ?? null,
    type: keyResult.type,
    startValue: keyResult.startValue,
    targetValue: keyResult.targetValue,
    currentValue: keyResult.currentValue,
    unit: keyResult.unit ?? null,
    status: keyResult.status,
    weight: keyResult.weight,
    progressPercentage: keyResult.progressPercentage,
    createdAt: keyResult.createdAt.toISOString(),
    updatedAt: keyResult.updatedAt.toISOString(),
  };
}
