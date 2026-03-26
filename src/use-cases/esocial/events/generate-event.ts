import { createHash } from 'node:crypto';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EsocialEvent } from '@/entities/esocial/esocial-event';
import { EsocialEventType } from '@/entities/esocial/value-objects/event-type';
import type { EsocialEventsRepository } from '@/repositories/esocial/esocial-events-repository';
import type { EsocialConfigRepository } from '@/repositories/esocial/esocial-config-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { AbsencesRepository } from '@/repositories/hr/absences-repository';
import type { TerminationsRepository } from '@/repositories/hr/terminations-repository';
import type { DependantsRepository } from '@/repositories/hr/dependants-repository';
import { S2190Builder } from '@/modules/esocial/services/builders/s2190-builder';
import { S2200Builder } from '@/modules/esocial/services/builders/s2200-builder';
import { S2206Builder } from '@/modules/esocial/services/builders/s2206-builder';
import {
  S2230Builder,
  ABSENCE_TYPE_TO_ESOCIAL_MOTIVO,
} from '@/modules/esocial/services/builders/s2230-builder';
import {
  S2299Builder,
  TERMINATION_TYPE_TO_ESOCIAL_MOTIVO,
} from '@/modules/esocial/services/builders/s2299-builder';

export interface GenerateEventRequest {
  tenantId: string;
  eventType: string;
  referenceType: string;
  referenceId: string;
}

export interface GenerateEventResponse {
  event: EsocialEvent;
}

/**
 * Generates an eSocial XML event from a source HR entity.
 *
 * Looks up the referenced entity (Employee, Absence, Termination),
 * selects the appropriate builder, generates XML, computes its hash,
 * and stores the event in DRAFT status.
 */
export class GenerateEventUseCase {
  constructor(
    private eventsRepository: EsocialEventsRepository,
    private configRepository: EsocialConfigRepository,
    private employeesRepository: EmployeesRepository,
    private absencesRepository: AbsencesRepository,
    private terminationsRepository: TerminationsRepository,
    private dependantsRepository: DependantsRepository,
  ) {}

  async execute(request: GenerateEventRequest): Promise<GenerateEventResponse> {
    const { tenantId, eventType, referenceType, referenceId } = request;

    // Validate event type
    const validEventTypes = [
      EsocialEventType.S_2190,
      EsocialEventType.S_2200,
      EsocialEventType.S_2206,
      EsocialEventType.S_2230,
      EsocialEventType.S_2299,
    ];
    if (!validEventTypes.includes(eventType as EsocialEventType)) {
      throw new BadRequestError(
        `Tipo de evento não suportado para geração automática: ${eventType}`,
      );
    }

    // Load tenant eSocial config
    const config = await this.configRepository.findByTenantId(tenantId);
    if (!config) {
      throw new BadRequestError(
        'Configuração eSocial não encontrada para este tenant. Configure antes de gerar eventos.',
      );
    }

    if (!config.nrInsc) {
      throw new BadRequestError(
        'CNPJ/CPF do empregador não configurado. Atualize a configuração eSocial.',
      );
    }

    const tpAmb: 1 | 2 = config.environment === 'PRODUCAO' ? 1 : 2;
    const tpInsc = config.tpInsc;
    const nrInsc = config.nrInsc;

    let xml: string;

    switch (eventType) {
      case EsocialEventType.S_2190:
        xml = await this.buildS2190(tenantId, referenceId, tpInsc, nrInsc, tpAmb);
        break;
      case EsocialEventType.S_2200:
        xml = await this.buildS2200(tenantId, referenceId, tpInsc, nrInsc, tpAmb);
        break;
      case EsocialEventType.S_2206:
        xml = await this.buildS2206(tenantId, referenceId, tpInsc, nrInsc, tpAmb);
        break;
      case EsocialEventType.S_2230:
        xml = await this.buildS2230(tenantId, referenceId, tpInsc, nrInsc, tpAmb);
        break;
      case EsocialEventType.S_2299:
        xml = await this.buildS2299(tenantId, referenceId, tpInsc, nrInsc, tpAmb);
        break;
      default:
        throw new BadRequestError(`Tipo de evento não suportado: ${eventType}`);
    }

    const xmlHash = createHash('sha256').update(xml).digest('hex');

    const event = await this.eventsRepository.create({
      tenantId,
      eventType,
      referenceId,
      referenceType,
      xmlContent: xml,
      xmlHash,
      status: 'DRAFT',
    });

    return { event };
  }

  // ---------------------------------------------------------------------------
  // Builder dispatchers
  // ---------------------------------------------------------------------------

  private async buildS2190(
    tenantId: string,
    employeeId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
  ): Promise<string> {
    const employee = await this.findEmployee(tenantId, employeeId);

    return new S2190Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      cpfTrab: employee.cpf.value,
      dtNascto: employee.birthDate!,
      dtAdm: employee.hireDate,
    });
  }

  private async buildS2200(
    tenantId: string,
    employeeId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
  ): Promise<string> {
    const employee = await this.findEmployee(tenantId, employeeId);
    const dependants = await this.dependantsRepository.findByEmployeeId(
      new UniqueEntityID(employeeId),
      tenantId,
    );

    const depMap: Record<string, string> = {
      SPOUSE: '01',
      CHILD: '03',
      STEPCHILD: '06',
      PARENT: '09',
      OTHER: '99',
    };

    const genderMap: Record<string, string> = {
      MALE: 'M',
      FEMALE: 'F',
      M: 'M',
      F: 'F',
    };

    const maritalMap: Record<string, number> = {
      SINGLE: 1,
      MARRIED: 2,
      DIVORCED: 3,
      SEPARATED: 4,
      WIDOWED: 5,
    };

    const contractMap: Record<string, number> = {
      CLT: 1,
      TEMPORARY: 2,
      INTERN: 2,
      APPRENTICE: 1,
      PJ: 1,
    };

    return new S2200Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      cpfTrab: employee.cpf.value,
      nmTrab: employee.fullName,
      sexo: genderMap[employee.gender ?? 'M'] ?? 'M',
      racaCor: 1, // Default — would need employee.raceColor field
      estCiv: maritalMap[employee.maritalStatus ?? 'SINGLE'],
      nmSoc: employee.socialName,
      paisNac: 105,
      nascimento: {
        dtNascto: employee.birthDate!,
        paisNascto: 105,
        nmMunic: employee.city,
        uf: employee.state,
      },
      endereco: employee.address
        ? {
            dscLograd: employee.address,
            nrLograd: employee.addressNumber ?? 'S/N',
            complemento: employee.complement,
            bairro: employee.neighborhood,
            cep: employee.zipCode ?? '00000000',
            uf: employee.state ?? 'SP',
          }
        : undefined,
      dependentes: dependants.map((d) => ({
        tpDep: depMap[d.relationship] ?? '99',
        nmDep: d.name,
        dtNascDep: d.birthDate,
        cpfDep: d.cpf,
        depIRRF: d.isIrrfDependant ? ('S' as const) : ('N' as const),
        depSF: d.isSalarioFamilia ? ('S' as const) : ('N' as const),
      })),
      matricula: employee.registrationNumber,
      tpRegTrab: 1,
      tpRegPrev: 1,
      cadIni: 'S',
      celetista: {
        dtAdm: employee.hireDate,
        tpAdmissao: 1,
        indAdmissao: 1,
        natAtividade: 1,
      },
      contrato: {
        nmCargo: employee.fullName, // Simplified — would use position name
        CBOCargo: '000000', // Would come from position.cboCode
        vrSalFx: employee.baseSalary ?? 0,
        undSalFixo: 5,
        tpContr: contractMap[employee.contractType.value] ?? 1,
        qtdHrsSem: employee.weeklyHours,
        tpJornada: 7,
      },
    });
  }

  private async buildS2206(
    tenantId: string,
    employeeId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
  ): Promise<string> {
    const employee = await this.findEmployee(tenantId, employeeId);

    const contractMap: Record<string, number> = {
      CLT: 1,
      TEMPORARY: 2,
      INTERN: 2,
      APPRENTICE: 1,
      PJ: 1,
    };

    return new S2206Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      cpfTrab: employee.cpf.value,
      matricula: employee.registrationNumber,
      dtAlteracao: new Date(),
      nmCargo: employee.fullName,
      CBOCargo: '000000',
      vrSalFx: employee.baseSalary ?? 0,
      undSalFixo: 5,
      tpContr: contractMap[employee.contractType.value] ?? 1,
      qtdHrsSem: employee.weeklyHours,
      tpJornada: 7,
    });
  }

  private async buildS2230(
    tenantId: string,
    absenceId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
  ): Promise<string> {
    const absence = await this.absencesRepository.findById(
      new UniqueEntityID(absenceId),
      tenantId,
    );
    if (!absence) {
      throw new ResourceNotFoundError('Ausência não encontrada');
    }

    const employee = await this.findEmployee(
      tenantId,
      absence.employeeId.toString(),
    );

    const motivo = ABSENCE_TYPE_TO_ESOCIAL_MOTIVO[absence.type.value];
    if (!motivo) {
      throw new BadRequestError(
        `Tipo de ausência "${absence.type.value}" não gera evento S-2230`,
      );
    }

    return new S2230Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      cpfTrab: employee.cpf.value,
      matricula: employee.registrationNumber,
      dtIniAfast: absence.startDate,
      codMotAfast: motivo,
      dtTermAfast: absence.endDate,
      codCID: absence.cid,
    });
  }

  private async buildS2299(
    tenantId: string,
    terminationId: string,
    tpInsc: number,
    nrInsc: string,
    tpAmb: 1 | 2,
  ): Promise<string> {
    const termination = await this.terminationsRepository.findById(
      new UniqueEntityID(terminationId),
      tenantId,
    );
    if (!termination) {
      throw new ResourceNotFoundError('Rescisão não encontrada');
    }

    const employee = await this.findEmployee(
      tenantId,
      termination.employeeId.toString(),
    );

    const mtvDeslig =
      TERMINATION_TYPE_TO_ESOCIAL_MOTIVO[termination.type] ?? '99';

    return new S2299Builder().build({
      tpInsc,
      nrInsc,
      tpAmb,
      cpfTrab: employee.cpf.value,
      matricula: employee.registrationNumber,
      mtvDeslig,
      dtDeslig: termination.terminationDate,
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async findEmployee(tenantId: string, employeeId: string) {
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
      tenantId,
    );
    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }
    if (!employee.cpf) {
      throw new BadRequestError(
        'CPF do funcionário é obrigatório para eventos eSocial',
      );
    }
    return employee;
  }
}
