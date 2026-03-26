import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface EsocialConfigProps {
  tenantId: UniqueEntityID;
  environment: string;
  version: string;
  tpInsc: number;
  nrInsc?: string;
  autoGenerateOnAdmission: boolean;
  autoGenerateOnTermination: boolean;
  autoGenerateOnLeave: boolean;
  autoGenerateOnPayroll: boolean;
  requireApproval: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class EsocialConfig extends Entity<EsocialConfigProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get environment(): string {
    return this.props.environment;
  }

  get version(): string {
    return this.props.version;
  }

  get tpInsc(): number {
    return this.props.tpInsc;
  }

  get nrInsc(): string | undefined {
    return this.props.nrInsc;
  }

  get autoGenerateOnAdmission(): boolean {
    return this.props.autoGenerateOnAdmission;
  }

  get autoGenerateOnTermination(): boolean {
    return this.props.autoGenerateOnTermination;
  }

  get autoGenerateOnLeave(): boolean {
    return this.props.autoGenerateOnLeave;
  }

  get autoGenerateOnPayroll(): boolean {
    return this.props.autoGenerateOnPayroll;
  }

  get requireApproval(): boolean {
    return this.props.requireApproval;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Domain methods
  isProduction(): boolean {
    return this.props.environment === 'PRODUCAO';
  }

  updateEnvironment(environment: string): void {
    if (!['PRODUCAO', 'HOMOLOGACAO'].includes(environment)) {
      throw new Error('Invalid environment. Must be PRODUCAO or HOMOLOGACAO');
    }
    this.props.environment = environment;
    this.props.updatedAt = new Date();
  }

  updateNrInsc(nrInsc: string): void {
    const cleaned = nrInsc.replace(/\D/g, '');
    if (this.props.tpInsc === 1 && cleaned.length !== 14) {
      throw new Error('CNPJ must have 14 digits');
    }
    if (this.props.tpInsc === 2 && cleaned.length !== 11) {
      throw new Error('CPF must have 11 digits');
    }
    this.props.nrInsc = cleaned;
    this.props.updatedAt = new Date();
  }

  private constructor(props: EsocialConfigProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<EsocialConfigProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): EsocialConfig {
    const now = new Date();

    return new EsocialConfig(
      {
        ...props,
        environment: props.environment ?? 'HOMOLOGACAO',
        version: props.version ?? 'S-1.2',
        tpInsc: props.tpInsc ?? 1,
        autoGenerateOnAdmission: props.autoGenerateOnAdmission ?? true,
        autoGenerateOnTermination: props.autoGenerateOnTermination ?? true,
        autoGenerateOnLeave: props.autoGenerateOnLeave ?? true,
        autoGenerateOnPayroll: props.autoGenerateOnPayroll ?? true,
        requireApproval: props.requireApproval ?? true,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
