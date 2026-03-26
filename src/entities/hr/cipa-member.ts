import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type CipaMemberRole =
  | 'PRESIDENTE'
  | 'VICE_PRESIDENTE'
  | 'SECRETARIO'
  | 'MEMBRO_TITULAR'
  | 'MEMBRO_SUPLENTE';

export type CipaMemberType = 'EMPREGADOR' | 'EMPREGADO';

export interface CipaMemberProps {
  tenantId: UniqueEntityID;
  mandateId: UniqueEntityID;
  employeeId: UniqueEntityID;
  role: CipaMemberRole;
  type: CipaMemberType;
  isStable: boolean;
  stableUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class CipaMember extends Entity<CipaMemberProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get mandateId(): UniqueEntityID {
    return this.props.mandateId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get role(): CipaMemberRole {
    return this.props.role;
  }

  get type(): CipaMemberType {
    return this.props.type;
  }

  get isStable(): boolean {
    return this.props.isStable;
  }

  get stableUntil(): Date | undefined {
    return this.props.stableUntil;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Elected members (type=EMPREGADO) have job stability
   * during mandate + 1 year after mandate ends
   */
  hasJobStability(): boolean {
    if (!this.isStable || !this.stableUntil) return false;
    return new Date() < this.stableUntil;
  }

  isElected(): boolean {
    return this.type === 'EMPREGADO';
  }

  isAppointed(): boolean {
    return this.type === 'EMPREGADOR';
  }

  private constructor(props: CipaMemberProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<CipaMemberProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): CipaMember {
    const now = new Date();

    return new CipaMember(
      {
        ...props,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
