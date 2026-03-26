import type { WorkplaceRisk } from '@/entities/hr/workplace-risk';

export interface WorkplaceRiskDTO {
  id: string;
  safetyProgramId: string;
  name: string;
  category: string;
  severity: string;
  source: string | null;
  affectedArea: string | null;
  controlMeasures: string | null;
  epiRequired: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function workplaceRiskToDTO(risk: WorkplaceRisk): WorkplaceRiskDTO {
  return {
    id: risk.id.toString(),
    safetyProgramId: risk.safetyProgramId.toString(),
    name: risk.name,
    category: risk.category,
    severity: risk.severity,
    source: risk.source ?? null,
    affectedArea: risk.affectedArea ?? null,
    controlMeasures: risk.controlMeasures ?? null,
    epiRequired: risk.epiRequired ?? null,
    isActive: risk.isActive,
    createdAt: risk.createdAt.toISOString(),
    updatedAt: risk.updatedAt.toISOString(),
  };
}
