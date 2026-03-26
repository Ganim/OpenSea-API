import type { SafetyProgram } from '@/entities/hr/safety-program';

export interface SafetyProgramDTO {
  id: string;
  type: string;
  name: string;
  validFrom: string;
  validUntil: string;
  responsibleName: string;
  responsibleRegistration: string;
  documentUrl: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function safetyProgramToDTO(program: SafetyProgram): SafetyProgramDTO {
  return {
    id: program.id.toString(),
    type: program.type,
    name: program.name,
    validFrom: program.validFrom.toISOString(),
    validUntil: program.validUntil.toISOString(),
    responsibleName: program.responsibleName,
    responsibleRegistration: program.responsibleRegistration,
    documentUrl: program.documentUrl ?? null,
    status: program.status,
    notes: program.notes ?? null,
    createdAt: program.createdAt.toISOString(),
    updatedAt: program.updatedAt.toISOString(),
  };
}
