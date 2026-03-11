import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { AbsencesRepository } from '@/repositories/hr/absences-repository';

export interface GenerateAbsencesReportRequest {
  tenantId: string;
  startDate: Date;
  endDate: Date;
  employeeId?: string;
  type?: string;
  status?: string;
}

export interface GenerateAbsencesReportResponse {
  csv: string;
  fileName: string;
}

const ABSENCE_TYPE_LABELS: Record<string, string> = {
  VACATION: 'Férias',
  SICK_LEAVE: 'Licença Médica',
  MATERNITY: 'Licença Maternidade',
  PATERNITY: 'Licença Paternidade',
  BEREAVEMENT: 'Licença Nojo',
  PERSONAL: 'Pessoal',
  OTHER: 'Outro',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  CANCELLED: 'Cancelado',
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

export class GenerateAbsencesReportUseCase {
  constructor(private absencesRepository: AbsencesRepository) {}

  async execute(
    request: GenerateAbsencesReportRequest,
  ): Promise<GenerateAbsencesReportResponse> {
    const { tenantId, startDate, endDate, employeeId, type, status } = request;

    const absences = await this.absencesRepository.findMany(tenantId, {
      startDate,
      endDate,
      employeeId: employeeId ? new UniqueEntityID(employeeId) : undefined,
      type,
      status,
    });

    const headers = [
      'Funcionário',
      'Tipo de Ausência',
      'Data Início',
      'Data Fim',
      'Dias',
      'Status',
      'Motivo',
    ];

    const rows = absences.map((abs) => {
      const days =
        Math.ceil(
          (abs.endDate.getTime() - abs.startDate.getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1;
      return [
        abs.employeeId.toString(),
        ABSENCE_TYPE_LABELS[abs.type.value] || abs.type.value,
        formatDate(abs.startDate),
        formatDate(abs.endDate),
        String(days),
        STATUS_LABELS[abs.status.value] || abs.status.value,
        abs.reason || '',
      ];
    });

    const csvLines = [
      headers.join(';'),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'),
      ),
    ];

    const start = formatDate(startDate).replace(/\//g, '-');
    const end = formatDate(endDate).replace(/\//g, '-');
    return {
      csv: '\uFEFF' + csvLines.join('\r\n'),
      fileName: `ausencias_${start}_${end}.csv`,
    };
  }
}
