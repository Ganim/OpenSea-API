import type { TrainingProgram } from '@/entities/hr/training-program';

export interface TrainingProgramDTO {
  id: string;
  name: string;
  description: string | null;
  category: string;
  format: string;
  durationHours: number;
  instructor: string | null;
  maxParticipants: number | null;
  isActive: boolean;
  isMandatory: boolean;
  validityMonths: number | null;
  createdAt: string;
  updatedAt: string;
}

export function trainingProgramToDTO(
  program: TrainingProgram,
): TrainingProgramDTO {
  return {
    id: program.id.toString(),
    name: program.name,
    description: program.description ?? null,
    category: program.category,
    format: program.format,
    durationHours: program.durationHours,
    instructor: program.instructor ?? null,
    maxParticipants: program.maxParticipants ?? null,
    isActive: program.isActive,
    isMandatory: program.isMandatory,
    validityMonths: program.validityMonths ?? null,
    createdAt: program.createdAt.toISOString(),
    updatedAt: program.updatedAt.toISOString(),
  };
}
