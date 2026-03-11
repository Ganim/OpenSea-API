import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type CompanyStakeholderRole =
  | 'SOCIO'
  | 'ADMINISTRADOR'
  | 'PROCURADOR'
  | 'REPRESENTANTE_LEGAL'
  | 'GERENTE'
  | 'DIRETOR'
  | 'OUTRO';

export type CompanyStakeholderStatus = 'ACTIVE' | 'INACTIVE';

export type CompanyStakeholderSource = 'CNPJ_API' | 'MANUAL';

export interface CompanyStakeholderProps {
  companyId: UniqueEntityID;
  name: string;
  role?: CompanyStakeholderRole;
  entryDate?: Date;
  exitDate?: Date;
  personDocumentMasked?: string;
  isLegalRepresentative: boolean;
  status: CompanyStakeholderStatus;
  source: CompanyStakeholderSource;
  rawPayloadRef?: string;
  metadata: Record<string, unknown>;
  pendingIssues: string[];
  anonimizedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class CompanyStakeholder extends Entity<CompanyStakeholderProps> {
  get companyId(): UniqueEntityID {
    return this.props.companyId;
  }

  get name(): string {
    return this.props.name;
  }

  get role(): CompanyStakeholderRole | undefined {
    return this.props.role;
  }

  get entryDate(): Date | undefined {
    return this.props.entryDate;
  }

  get exitDate(): Date | undefined {
    return this.props.exitDate;
  }

  get personDocumentMasked(): string | undefined {
    return this.props.personDocumentMasked;
  }

  get isLegalRepresentative(): boolean {
    return this.props.isLegalRepresentative;
  }

  get status(): CompanyStakeholderStatus {
    return this.props.status;
  }

  get source(): CompanyStakeholderSource {
    return this.props.source;
  }

  get rawPayloadRef(): string | undefined {
    return this.props.rawPayloadRef;
  }

  get metadata(): Record<string, unknown> {
    return this.props.metadata ?? {};
  }

  get pendingIssues(): string[] {
    return this.props.pendingIssues ?? [];
  }

  get anonimizedAt(): Date | undefined {
    return this.props.anonimizedAt;
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

  static create(
    props: CompanyStakeholderProps,
    id?: UniqueEntityID,
  ): CompanyStakeholder {
    const stakeholder = new CompanyStakeholder(props, id);
    return stakeholder;
  }
}
