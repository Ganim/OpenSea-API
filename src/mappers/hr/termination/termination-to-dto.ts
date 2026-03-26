import type { Termination } from '@/entities/hr/termination';

export interface TerminationDTO {
  id: string;
  employeeId: string;
  type: string;
  terminationDate: string;
  lastWorkDay: string;
  noticeType: string;
  noticeDays: number;
  saldoSalario: number | null;
  avisoIndenizado: number | null;
  decimoTerceiroProp: number | null;
  feriasVencidas: number | null;
  feriasVencidasTerco: number | null;
  feriasProporcional: number | null;
  feriasProporcionalTerco: number | null;
  multaFgts: number | null;
  inssRescisao: number | null;
  irrfRescisao: number | null;
  outrosDescontos: number | null;
  totalBruto: number | null;
  totalDescontos: number | null;
  totalLiquido: number | null;
  paymentDeadline: string;
  paidAt: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function terminationToDTO(termination: Termination): TerminationDTO {
  return {
    id: termination.id.toString(),
    employeeId: termination.employeeId.toString(),
    type: termination.type,
    terminationDate: termination.terminationDate.toISOString(),
    lastWorkDay: termination.lastWorkDay.toISOString(),
    noticeType: termination.noticeType,
    noticeDays: termination.noticeDays,
    saldoSalario: termination.saldoSalario ?? null,
    avisoIndenizado: termination.avisoIndenizado ?? null,
    decimoTerceiroProp: termination.decimoTerceiroProp ?? null,
    feriasVencidas: termination.feriasVencidas ?? null,
    feriasVencidasTerco: termination.feriasVencidasTerco ?? null,
    feriasProporcional: termination.feriasProporcional ?? null,
    feriasProporcionalTerco: termination.feriasProporcionalTerco ?? null,
    multaFgts: termination.multaFgts ?? null,
    inssRescisao: termination.inssRescisao ?? null,
    irrfRescisao: termination.irrfRescisao ?? null,
    outrosDescontos: termination.outrosDescontos ?? null,
    totalBruto: termination.totalBruto ?? null,
    totalDescontos: termination.totalDescontos ?? null,
    totalLiquido: termination.totalLiquido ?? null,
    paymentDeadline: termination.paymentDeadline.toISOString(),
    paidAt: termination.paidAt?.toISOString() ?? null,
    status: termination.status,
    notes: termination.notes ?? null,
    createdAt: termination.createdAt.toISOString(),
    updatedAt: termination.updatedAt.toISOString(),
  };
}
