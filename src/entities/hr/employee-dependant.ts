import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type DependantRelationship =
  | 'SPOUSE'
  | 'CHILD'
  | 'STEPCHILD'
  | 'PARENT'
  | 'OTHER';

export interface EmployeeDependantProps {
  tenantId: UniqueEntityID;
  employeeId: UniqueEntityID;
  name: string;
  cpf?: string;
  cpfHash?: string;
  birthDate: Date;
  relationship: DependantRelationship;
  isIrrfDependant: boolean;
  isSalarioFamilia: boolean;
  hasDisability: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class EmployeeDependant extends Entity<EmployeeDependantProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get name(): string {
    return this.props.name;
  }

  get cpf(): string | undefined {
    return this.props.cpf;
  }

  get cpfHash(): string | undefined {
    return this.props.cpfHash;
  }

  get birthDate(): Date {
    return this.props.birthDate;
  }

  get relationship(): DependantRelationship {
    return this.props.relationship;
  }

  get isIrrfDependant(): boolean {
    return this.props.isIrrfDependant;
  }

  get isSalarioFamilia(): boolean {
    return this.props.isSalarioFamilia;
  }

  get hasDisability(): boolean {
    return this.props.hasDisability;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  isChild(): boolean {
    return (
      this.relationship === 'CHILD' || this.relationship === 'STEPCHILD'
    );
  }

  isSpouse(): boolean {
    return this.relationship === 'SPOUSE';
  }

  private constructor(props: EmployeeDependantProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<EmployeeDependantProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): EmployeeDependant {
    const now = new Date();

    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Nome do dependente é obrigatório');
    }

    return new EmployeeDependant(
      {
        ...props,
        name: props.name.trim(),
        isIrrfDependant: props.isIrrfDependant ?? false,
        isSalarioFamilia: props.isSalarioFamilia ?? false,
        hasDisability: props.hasDisability ?? false,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
