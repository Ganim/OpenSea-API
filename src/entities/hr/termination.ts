import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export enum TerminationType {
  SEM_JUSTA_CAUSA = 'SEM_JUSTA_CAUSA',
  JUSTA_CAUSA = 'JUSTA_CAUSA',
  PEDIDO_DEMISSAO = 'PEDIDO_DEMISSAO',
  ACORDO_MUTUO = 'ACORDO_MUTUO',
  CONTRATO_TEMPORARIO = 'CONTRATO_TEMPORARIO',
  RESCISAO_INDIRETA = 'RESCISAO_INDIRETA',
  FALECIMENTO = 'FALECIMENTO',
}

export enum NoticeType {
  TRABALHADO = 'TRABALHADO',
  INDENIZADO = 'INDENIZADO',
  DISPENSADO = 'DISPENSADO',
}

export enum TerminationStatus {
  PENDING = 'PENDING',
  CALCULATED = 'CALCULATED',
  PAID = 'PAID',
}

export interface TerminationProps {
  tenantId: UniqueEntityID;
  employeeId: UniqueEntityID;

  type: TerminationType;
  terminationDate: Date;
  lastWorkDay: Date;
  noticeType: NoticeType;
  noticeDays: number;

  // Verbas rescisórias
  saldoSalario?: number;
  avisoIndenizado?: number;
  decimoTerceiroProp?: number;
  feriasVencidas?: number;
  feriasVencidasTerco?: number;
  feriasProporcional?: number;
  feriasProporcionalTerco?: number;
  multaFgts?: number;

  // Descontos
  inssRescisao?: number;
  irrfRescisao?: number;
  outrosDescontos?: number;

  // Totais
  totalBruto?: number;
  totalDescontos?: number;
  totalLiquido?: number;

  // Controle
  paymentDeadline: Date;
  paidAt?: Date;
  status: TerminationStatus;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

export class Termination extends Entity<TerminationProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get type(): TerminationType {
    return this.props.type;
  }

  get terminationDate(): Date {
    return this.props.terminationDate;
  }

  get lastWorkDay(): Date {
    return this.props.lastWorkDay;
  }

  get noticeType(): NoticeType {
    return this.props.noticeType;
  }

  get noticeDays(): number {
    return this.props.noticeDays;
  }

  get saldoSalario(): number | undefined {
    return this.props.saldoSalario;
  }

  get avisoIndenizado(): number | undefined {
    return this.props.avisoIndenizado;
  }

  get decimoTerceiroProp(): number | undefined {
    return this.props.decimoTerceiroProp;
  }

  get feriasVencidas(): number | undefined {
    return this.props.feriasVencidas;
  }

  get feriasVencidasTerco(): number | undefined {
    return this.props.feriasVencidasTerco;
  }

  get feriasProporcional(): number | undefined {
    return this.props.feriasProporcional;
  }

  get feriasProporcionalTerco(): number | undefined {
    return this.props.feriasProporcionalTerco;
  }

  get multaFgts(): number | undefined {
    return this.props.multaFgts;
  }

  get inssRescisao(): number | undefined {
    return this.props.inssRescisao;
  }

  get irrfRescisao(): number | undefined {
    return this.props.irrfRescisao;
  }

  get outrosDescontos(): number | undefined {
    return this.props.outrosDescontos;
  }

  get totalBruto(): number | undefined {
    return this.props.totalBruto;
  }

  get totalDescontos(): number | undefined {
    return this.props.totalDescontos;
  }

  get totalLiquido(): number | undefined {
    return this.props.totalLiquido;
  }

  get paymentDeadline(): Date {
    return this.props.paymentDeadline;
  }

  get paidAt(): Date | undefined {
    return this.props.paidAt;
  }

  get status(): TerminationStatus {
    return this.props.status;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  isPending(): boolean {
    return this.props.status === TerminationStatus.PENDING;
  }

  isCalculated(): boolean {
    return this.props.status === TerminationStatus.CALCULATED;
  }

  isPaid(): boolean {
    return this.props.status === TerminationStatus.PAID;
  }

  markAsCalculated(values: {
    saldoSalario: number;
    avisoIndenizado: number;
    decimoTerceiroProp: number;
    feriasVencidas: number;
    feriasVencidasTerco: number;
    feriasProporcional: number;
    feriasProporcionalTerco: number;
    multaFgts: number;
    inssRescisao: number;
    irrfRescisao: number;
    outrosDescontos: number;
    totalBruto: number;
    totalDescontos: number;
    totalLiquido: number;
  }): void {
    if (!this.isPending()) {
      throw new Error('Somente rescisões pendentes podem ser calculadas');
    }

    this.props.saldoSalario = values.saldoSalario;
    this.props.avisoIndenizado = values.avisoIndenizado;
    this.props.decimoTerceiroProp = values.decimoTerceiroProp;
    this.props.feriasVencidas = values.feriasVencidas;
    this.props.feriasVencidasTerco = values.feriasVencidasTerco;
    this.props.feriasProporcional = values.feriasProporcional;
    this.props.feriasProporcionalTerco = values.feriasProporcionalTerco;
    this.props.multaFgts = values.multaFgts;
    this.props.inssRescisao = values.inssRescisao;
    this.props.irrfRescisao = values.irrfRescisao;
    this.props.outrosDescontos = values.outrosDescontos;
    this.props.totalBruto = values.totalBruto;
    this.props.totalDescontos = values.totalDescontos;
    this.props.totalLiquido = values.totalLiquido;
    this.props.status = TerminationStatus.CALCULATED;
    this.props.updatedAt = new Date();
  }

  markAsPaid(): void {
    if (!this.isCalculated()) {
      throw new Error(
        'Somente rescisões calculadas podem ser marcadas como pagas',
      );
    }

    this.props.status = TerminationStatus.PAID;
    this.props.paidAt = new Date();
    this.props.updatedAt = new Date();
  }

  updateNotes(notes: string): void {
    this.props.notes = notes;
    this.props.updatedAt = new Date();
  }

  private constructor(props: TerminationProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<TerminationProps, 'createdAt' | 'updatedAt' | 'status'> & {
      status?: TerminationStatus;
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): Termination {
    const now = new Date();

    return new Termination(
      {
        ...props,
        status: props.status ?? TerminationStatus.PENDING,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
