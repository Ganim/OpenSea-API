import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type MedicalExamType =
  | 'ADMISSIONAL'
  | 'PERIODICO'
  | 'MUDANCA_FUNCAO'
  | 'RETORNO'
  | 'DEMISSIONAL';

export type MedicalExamResult =
  | 'APTO'
  | 'INAPTO'
  | 'APTO_COM_RESTRICOES';

export interface MedicalExamProps {
  tenantId: UniqueEntityID;
  employeeId: UniqueEntityID;
  type: MedicalExamType;
  examDate: Date;
  expirationDate?: Date;
  doctorName: string;
  doctorCrm: string;
  result: MedicalExamResult;
  observations?: string;
  documentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MedicalExam extends Entity<MedicalExamProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get type(): MedicalExamType {
    return this.props.type;
  }

  get examDate(): Date {
    return this.props.examDate;
  }

  get expirationDate(): Date | undefined {
    return this.props.expirationDate;
  }

  get doctorName(): string {
    return this.props.doctorName;
  }

  get doctorCrm(): string {
    return this.props.doctorCrm;
  }

  get result(): MedicalExamResult {
    return this.props.result;
  }

  get observations(): string | undefined {
    return this.props.observations;
  }

  get documentUrl(): string | undefined {
    return this.props.documentUrl;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  isExpired(): boolean {
    if (!this.expirationDate) return false;
    return new Date() > this.expirationDate;
  }

  isApto(): boolean {
    return this.result === 'APTO';
  }

  isInapto(): boolean {
    return this.result === 'INAPTO';
  }

  isAptoComRestricoes(): boolean {
    return this.result === 'APTO_COM_RESTRICOES';
  }

  isAdmissional(): boolean {
    return this.type === 'ADMISSIONAL';
  }

  isDemissional(): boolean {
    return this.type === 'DEMISSIONAL';
  }

  hasDocument(): boolean {
    return !!this.documentUrl;
  }

  private constructor(props: MedicalExamProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<MedicalExamProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): MedicalExam {
    const now = new Date();

    if (!props.doctorName || props.doctorName.trim().length === 0) {
      throw new Error('Nome do médico é obrigatório');
    }

    if (!props.doctorCrm || props.doctorCrm.trim().length === 0) {
      throw new Error('CRM do médico é obrigatório');
    }

    return new MedicalExam(
      {
        ...props,
        doctorName: props.doctorName.trim(),
        doctorCrm: props.doctorCrm.trim(),
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
