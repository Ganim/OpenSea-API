import type { CipaMember } from '@/entities/hr/cipa-member';

export interface CipaMemberDTO {
  id: string;
  mandateId: string;
  employeeId: string;
  role: string;
  type: string;
  isStable: boolean;
  stableUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export function cipaMemberToDTO(member: CipaMember): CipaMemberDTO {
  return {
    id: member.id.toString(),
    mandateId: member.mandateId.toString(),
    employeeId: member.employeeId.toString(),
    role: member.role,
    type: member.type,
    isStable: member.isStable,
    stableUntil: member.stableUntil?.toISOString() ?? null,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  };
}
