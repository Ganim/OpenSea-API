import type { CipaMandate } from '@/entities/hr/cipa-mandate';

export interface CipaMandateDTO {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  electionDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function cipaMandateToDTO(mandate: CipaMandate): CipaMandateDTO {
  return {
    id: mandate.id.toString(),
    name: mandate.name,
    startDate: mandate.startDate.toISOString(),
    endDate: mandate.endDate.toISOString(),
    status: mandate.status,
    electionDate: mandate.electionDate?.toISOString() ?? null,
    notes: mandate.notes ?? null,
    createdAt: mandate.createdAt.toISOString(),
    updatedAt: mandate.updatedAt.toISOString(),
  };
}
