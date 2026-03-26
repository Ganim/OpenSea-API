import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  NoticeType,
  TerminationStatus,
  TerminationType,
} from '@/entities/hr/termination';
import type { Termination as PrismaTermination } from '@prisma/generated/client.js';

export function mapTerminationPrismaToDomain(t: PrismaTermination) {
  return {
    tenantId: new UniqueEntityID(t.tenantId),
    employeeId: new UniqueEntityID(t.employeeId),
    type: t.type as TerminationType,
    terminationDate: t.terminationDate,
    lastWorkDay: t.lastWorkDay,
    noticeType: t.noticeType as NoticeType,
    noticeDays: t.noticeDays,
    saldoSalario: t.saldoSalario ? Number(t.saldoSalario) : undefined,
    avisoIndenizado: t.avisoIndenizado ? Number(t.avisoIndenizado) : undefined,
    decimoTerceiroProp: t.decimoTerceiroProp
      ? Number(t.decimoTerceiroProp)
      : undefined,
    feriasVencidas: t.feriasVencidas ? Number(t.feriasVencidas) : undefined,
    feriasVencidasTerco: t.feriasVencidasTerco
      ? Number(t.feriasVencidasTerco)
      : undefined,
    feriasProporcional: t.feriasProporcional
      ? Number(t.feriasProporcional)
      : undefined,
    feriasProporcionalTerco: t.feriasProporcionalTerco
      ? Number(t.feriasProporcionalTerco)
      : undefined,
    multaFgts: t.multaFgts ? Number(t.multaFgts) : undefined,
    inssRescisao: t.inssRescisao ? Number(t.inssRescisao) : undefined,
    irrfRescisao: t.irrfRescisao ? Number(t.irrfRescisao) : undefined,
    outrosDescontos: t.outrosDescontos ? Number(t.outrosDescontos) : undefined,
    totalBruto: t.totalBruto ? Number(t.totalBruto) : undefined,
    totalDescontos: t.totalDescontos ? Number(t.totalDescontos) : undefined,
    totalLiquido: t.totalLiquido ? Number(t.totalLiquido) : undefined,
    paymentDeadline: t.paymentDeadline,
    paidAt: t.paidAt ?? undefined,
    status: t.status as TerminationStatus,
    notes: t.notes ?? undefined,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}
