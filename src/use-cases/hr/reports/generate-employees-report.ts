import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface GenerateEmployeesReportRequest {
  tenantId: string;
  status?: string;
  departmentId?: string;
  positionId?: string;
  companyId?: string;
}

export interface GenerateEmployeesReportResponse {
  csv: string;
  fileName: string;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo',
  ON_LEAVE: 'Em Licença',
  VACATION: 'Férias',
  SUSPENDED: 'Suspenso',
  TERMINATED: 'Desligado',
};

const CONTRACT_LABELS: Record<string, string> = {
  CLT: 'CLT',
  PJ: 'Pessoa Jurídica',
  INTERN: 'Estagiário',
  TEMPORARY: 'Temporário',
  APPRENTICE: 'Aprendiz',
};

const REGIME_LABELS: Record<string, string> = {
  FULL_TIME: 'Integral',
  PART_TIME: 'Meio Período',
  SHIFT: 'Turnos',
};

function maskCpf(cpf: string): string {
  if (!cpf || cpf.length < 2) return '***';
  return `***.***.***-${cpf.slice(-2)}`;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

export class GenerateEmployeesReportUseCase {
  constructor(private employeesRepository: EmployeesRepository) {}

  async execute(
    request: GenerateEmployeesReportRequest,
  ): Promise<GenerateEmployeesReportResponse> {
    const { tenantId, status, departmentId, positionId, companyId } = request;

    const { employees } = await this.employeesRepository.findManyPaginated(
      tenantId,
      {
        status,
        departmentId: departmentId
          ? new UniqueEntityID(departmentId)
          : undefined,
        positionId: positionId ? new UniqueEntityID(positionId) : undefined,
        companyId: companyId ? new UniqueEntityID(companyId) : undefined,
      },
      0,
      10000,
    );

    const headers = [
      'Nome Completo',
      'Matrícula',
      'CPF',
      'Departamento',
      'Cargo',
      'Empresa',
      'Status',
      'Data de Admissão',
      'Tipo de Contrato',
      'Regime de Trabalho',
    ];

    const rows = employees.map((emp) => [
      emp.fullName,
      emp.registrationNumber,
      maskCpf(emp.cpf.value),
      emp.departmentId?.toString() || '',
      emp.positionId?.toString() || '',
      emp.companyId?.toString() || '',
      STATUS_LABELS[emp.status.value] || emp.status.value,
      formatDate(emp.hireDate),
      CONTRACT_LABELS[emp.contractType.value] || emp.contractType.value,
      REGIME_LABELS[emp.workRegime.value] || emp.workRegime.value,
    ]);

    const csvLines = [
      headers.join(';'),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'),
      ),
    ];

    const today = formatDate(new Date()).replace(/\//g, '-');
    return {
      csv: '\uFEFF' + csvLines.join('\r\n'),
      fileName: `funcionarios_${today}.csv`,
    };
  }
}
