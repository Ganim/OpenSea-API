import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type MedicalExamType =
  | 'ADMISSIONAL'
  | 'PERIODICO'
  | 'MUDANCA_FUNCAO'
  | 'RETORNO'
  | 'DEMISSIONAL';

export type MedicalExamResult = 'APTO' | 'INAPTO' | 'APTO_COM_RESTRICOES';

export type MedicalExamAptitude = 'APTO' | 'INAPTO' | 'APTO_COM_RESTRICOES';

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
  // PCMSO / Occupational Health fields
  examCategory?: MedicalExamType;
  validityMonths?: number;
  clinicName?: string;
  clinicAddress?: string;
  physicianName?: string;
  physicianCRM?: string;
  aptitude?: MedicalExamAptitude;
  restrictions?: string;
  nextExamDate?: Date;
  /**
   * NR-7 20-year retention flag (P0-02).
   * When set, the ASO must not appear in any read path — but the record
   * itself stays in the database for audit/compliance purposes.
   */
  deletedAt?: Date;
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

  get examCategory(): MedicalExamType | undefined {
    return this.props.examCategory;
  }

  get validityMonths(): number | undefined {
    return this.props.validityMonths;
  }

  get clinicName(): string | undefined {
    return this.props.clinicName;
  }

  get clinicAddress(): string | undefined {
    return this.props.clinicAddress;
  }

  get physicianName(): string | undefined {
    return this.props.physicianName;
  }

  get physicianCRM(): string | undefined {
    return this.props.physicianCRM;
  }

  get aptitude(): MedicalExamAptitude | undefined {
    return this.props.aptitude;
  }

  get restrictions(): string | undefined {
    return this.props.restrictions;
  }

  get nextExamDate(): Date | undefined {
    return this.props.nextExamDate;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
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

  isExpiringSoon(daysThreshold = 30): boolean {
    if (!this.expirationDate) return false;
    const now = new Date();
    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() + daysThreshold);
    return this.expirationDate > now && this.expirationDate <= threshold;
  }

  isOverdue(): boolean {
    if (!this.expirationDate) return false;
    return new Date() > this.expirationDate;
  }

  isValid(): boolean {
    if (!this.expirationDate) return true;
    return new Date() <= this.expirationDate;
  }

  hasRestrictions(): boolean {
    return (
      this.aptitude === 'APTO_COM_RESTRICOES' ||
      this.result === 'APTO_COM_RESTRICOES'
    );
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
