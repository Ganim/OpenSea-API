import { Entity } from '../../domain/entities';
import { UniqueEntityID } from '../../domain/unique-entity-id';

export type OrganizationType =
  | 'COMPANY'
  | 'SUPPLIER'
  | 'MANUFACTURER'
  | 'CUSTOMER';
export type OrganizationStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'BLOCKED';
export type TaxRegime =
  | 'SIMPLES'
  | 'LUCRO_PRESUMIDO'
  | 'LUCRO_REAL'
  | 'IMUNE_ISENTA'
  | 'OUTROS';

export interface OrganizationProps {
  // Type discriminator
  type: OrganizationType;

  // Dados obrigatórios
  legalName: string;

  // Identificação fiscal
  cnpj?: string | null;
  cpf?: string | null;

  // Dados opcionais principais
  tradeName?: string | null;
  stateRegistration?: string | null; // IE
  municipalRegistration?: string | null; // IM
  taxRegime?: TaxRegime | null;
  status: OrganizationStatus;
  email?: string | null;
  phoneMain?: string | null;
  website?: string | null;

  // Dados específicos por tipo (JSON)
  typeSpecificData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;

  // Audit
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class Organization extends Entity<OrganizationProps> {
  // Type discriminator - cada subclasse deve definir
  protected abstract readonly organizationType: OrganizationType;

  // Getters obrigatórios
  get type(): OrganizationType {
    return this.props.type;
  }

  get legalName(): string {
    return this.props.legalName;
  }

  get status(): OrganizationStatus {
    return this.props.status;
  }

  // Getters de identificação fiscal
  get cnpj(): string | null | undefined {
    return this.props.cnpj;
  }

  get cpf(): string | null | undefined {
    return this.props.cpf;
  }

  // Getters principais
  get tradeName(): string | null | undefined {
    return this.props.tradeName;
  }

  get stateRegistration(): string | null | undefined {
    return this.props.stateRegistration;
  }

  get municipalRegistration(): string | null | undefined {
    return this.props.municipalRegistration;
  }

  get taxRegime(): TaxRegime | null | undefined {
    return this.props.taxRegime;
  }

  get email(): string | null | undefined {
    return this.props.email;
  }

  get phoneMain(): string | null | undefined {
    return this.props.phoneMain;
  }

  get website(): string | null | undefined {
    return this.props.website;
  }

  // Getters metadados
  get typeSpecificData(): Record<string, unknown> {
    return this.props.typeSpecificData ?? {};
  }

  get metadata(): Record<string, unknown> {
    return this.props.metadata ?? {};
  }

  // Getters audit
  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  isDeleted(): boolean {
    return this.deletedAt !== undefined && this.deletedAt !== null;
  }

  isActive(): boolean {
    return this.status === 'ACTIVE' && !this.isDeleted();
  }

  isSuspended(): boolean {
    return this.status === 'SUSPENDED';
  }

  isBlocked(): boolean {
    return this.status === 'BLOCKED';
  }

  // Type guards
  isCompany(): boolean {
    return this.type === 'COMPANY';
  }

  isSupplier(): boolean {
    return this.type === 'SUPPLIER';
  }

  isManufacturer(): boolean {
    return this.type === 'MANUFACTURER';
  }

  isCustomer(): boolean {
    return this.type === 'CUSTOMER';
  }

  // Métodos de negócio comuns
  delete(): void {
    if (this.isDeleted()) {
      throw new Error('Organization is already deleted');
    }
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  restore(): void {
    if (!this.isDeleted()) {
      throw new Error('Organization is not deleted');
    }
    this.props.deletedAt = undefined;
    this.props.updatedAt = new Date();
  }

  changeStatus(status: OrganizationStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.changeStatus('ACTIVE');
  }

  deactivate(): void {
    this.changeStatus('INACTIVE');
  }

  suspend(): void {
    this.changeStatus('SUSPENDED');
  }

  block(): void {
    this.changeStatus('BLOCKED');
  }

  updateMainData(data: {
    tradeName?: string | null;
    stateRegistration?: string | null;
    municipalRegistration?: string | null;
    taxRegime?: TaxRegime | null;
    email?: string | null;
    phoneMain?: string | null;
    website?: string | null;
  }): void {
    if (data.tradeName !== undefined) this.props.tradeName = data.tradeName;
    if (data.stateRegistration !== undefined)
      this.props.stateRegistration = data.stateRegistration;
    if (data.municipalRegistration !== undefined)
      this.props.municipalRegistration = data.municipalRegistration;
    if (data.taxRegime !== undefined) this.props.taxRegime = data.taxRegime;
    if (data.email !== undefined) this.props.email = data.email;
    if (data.phoneMain !== undefined) this.props.phoneMain = data.phoneMain;
    if (data.website !== undefined) this.props.website = data.website;

    this.props.updatedAt = new Date();
  }

  updateMetadata(metadata: Record<string, unknown>): void {
    this.props.metadata = metadata;
    this.props.updatedAt = new Date();
  }

  updateTypeSpecificData(data: Record<string, unknown>): void {
    this.props.typeSpecificData = {
      ...this.typeSpecificData,
      ...data,
    };
    this.props.updatedAt = new Date();
  }

  // Validação básica
  protected validateFiscalId(): void {
    if (!this.cnpj && !this.cpf) {
      throw new Error('Organization must have either CNPJ or CPF');
    }
  }

  // Factory method abstrato - cada subclasse implementa
  protected constructor(props: OrganizationProps, id?: UniqueEntityID) {
    super(props, id);
    // Type validation will be done by concrete classes
  }
}
