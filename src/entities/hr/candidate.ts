import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface CandidateProps {
  tenantId: UniqueEntityID;
  fullName: string;
  email: string;
  phone?: string;
  cpf?: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  source: string;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  /**
   * Timestamp recorded when every PII field was scrubbed under LGPD Art. 18
   * VI. Absence means the candidate row still carries identifiable data.
   */
  anonymizedAt?: Date;
  /** Subject identifier of the user who triggered the anonymization. */
  anonymizedBy?: string;
}

export class Candidate extends Entity<CandidateProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get email(): string {
    return this.props.email;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get cpf(): string | undefined {
    return this.props.cpf;
  }

  get resumeUrl(): string | undefined {
    return this.props.resumeUrl;
  }

  get linkedinUrl(): string | undefined {
    return this.props.linkedinUrl;
  }

  get source(): string {
    return this.props.source;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get tags(): string[] | undefined {
    return this.props.tags;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get anonymizedAt(): Date | undefined {
    return this.props.anonymizedAt;
  }

  get anonymizedBy(): string | undefined {
    return this.props.anonymizedBy;
  }

  get isAnonymized(): boolean {
    return Boolean(this.props.anonymizedAt);
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Scrubs every PII property in-place and marks the candidate as
   * anonymized. Intended ONLY for LGPD Art. 18 VI compliance — the caller
   * remains responsible for persisting the changes.
   *
   * Non-PII analytics fields (source channel, createdAt) are preserved so
   * recruitment-funnel metrics remain accurate.
   */
  anonymize(params: { anonymizedAt: Date; anonymizedByUserId: string }): void {
    const idHash8 = this.id.toString().slice(-8);
    this.props.fullName = `ANONIMIZADO-${idHash8}`;
    this.props.email = `anon-${idHash8}@redacted.local`;
    this.props.cpf = undefined;
    this.props.phone = undefined;
    this.props.resumeUrl = undefined;
    this.props.linkedinUrl = undefined;
    this.props.notes = undefined;
    this.props.tags = undefined;
    this.props.anonymizedAt = params.anonymizedAt;
    this.props.anonymizedBy = params.anonymizedByUserId;
    this.props.updatedAt = params.anonymizedAt;
  }

  updateName(fullName: string): void {
    if (!fullName || fullName.trim().length === 0) {
      throw new Error('Candidate name cannot be empty');
    }
    this.props.fullName = fullName;
    this.props.updatedAt = new Date();
  }

  private constructor(props: CandidateProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<CandidateProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): Candidate {
    const now = new Date();

    return new Candidate(
      {
        ...props,
        source: props.source ?? 'OTHER',
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
