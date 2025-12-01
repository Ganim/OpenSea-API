import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  PIS,
  WorkRegime,
} from './value-objects';

export interface EmployeeProps {
  registrationNumber: string;
  userId?: UniqueEntityID;
  fullName: string;
  socialName?: string;
  birthDate?: Date;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  birthPlace?: string;
  cpf: CPF;
  rg?: string;
  rgIssuer?: string;
  rgIssueDate?: Date;
  pis?: PIS;
  ctpsNumber?: string;
  ctpsSeries?: string;
  ctpsState?: string;
  voterTitle?: string;
  militaryDoc?: string;
  email?: string;
  personalEmail?: string;
  phone?: string;
  mobilePhone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  bankCode?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  bankAccountType?: string;
  pixKey?: string;
  departmentId?: UniqueEntityID;
  positionId?: UniqueEntityID;
  supervisorId?: UniqueEntityID;
  hireDate: Date;
  terminationDate?: Date;
  status: EmployeeStatus;
  baseSalary: number;
  contractType: ContractType;
  workRegime: WorkRegime;
  weeklyHours: number;
  photoUrl?: string;
  metadata: Record<string, unknown>;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Employee extends Entity<EmployeeProps> {
  get registrationNumber(): string {
    return this.props.registrationNumber;
  }

  get userId(): UniqueEntityID | undefined {
    return this.props.userId;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get socialName(): string | undefined {
    return this.props.socialName;
  }

  get birthDate(): Date | undefined {
    return this.props.birthDate;
  }

  get gender(): string | undefined {
    return this.props.gender;
  }

  get maritalStatus(): string | undefined {
    return this.props.maritalStatus;
  }

  get nationality(): string | undefined {
    return this.props.nationality;
  }

  get birthPlace(): string | undefined {
    return this.props.birthPlace;
  }

  get cpf(): CPF {
    return this.props.cpf;
  }

  get rg(): string | undefined {
    return this.props.rg;
  }

  get rgIssuer(): string | undefined {
    return this.props.rgIssuer;
  }

  get rgIssueDate(): Date | undefined {
    return this.props.rgIssueDate;
  }

  get pis(): PIS | undefined {
    return this.props.pis;
  }

  get ctpsNumber(): string | undefined {
    return this.props.ctpsNumber;
  }

  get ctpsSeries(): string | undefined {
    return this.props.ctpsSeries;
  }

  get ctpsState(): string | undefined {
    return this.props.ctpsState;
  }

  get voterTitle(): string | undefined {
    return this.props.voterTitle;
  }

  get militaryDoc(): string | undefined {
    return this.props.militaryDoc;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get personalEmail(): string | undefined {
    return this.props.personalEmail;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get mobilePhone(): string | undefined {
    return this.props.mobilePhone;
  }

  get emergencyContact(): string | undefined {
    return this.props.emergencyContact;
  }

  get emergencyPhone(): string | undefined {
    return this.props.emergencyPhone;
  }

  get address(): string | undefined {
    return this.props.address;
  }

  get addressNumber(): string | undefined {
    return this.props.addressNumber;
  }

  get complement(): string | undefined {
    return this.props.complement;
  }

  get neighborhood(): string | undefined {
    return this.props.neighborhood;
  }

  get city(): string | undefined {
    return this.props.city;
  }

  get state(): string | undefined {
    return this.props.state;
  }

  get zipCode(): string | undefined {
    return this.props.zipCode;
  }

  get country(): string {
    return this.props.country;
  }

  get bankCode(): string | undefined {
    return this.props.bankCode;
  }

  get bankName(): string | undefined {
    return this.props.bankName;
  }

  get bankAgency(): string | undefined {
    return this.props.bankAgency;
  }

  get bankAccount(): string | undefined {
    return this.props.bankAccount;
  }

  get bankAccountType(): string | undefined {
    return this.props.bankAccountType;
  }

  get pixKey(): string | undefined {
    return this.props.pixKey;
  }

  get departmentId(): UniqueEntityID | undefined {
    return this.props.departmentId;
  }

  get positionId(): UniqueEntityID | undefined {
    return this.props.positionId;
  }

  get supervisorId(): UniqueEntityID | undefined {
    return this.props.supervisorId;
  }

  get hireDate(): Date {
    return this.props.hireDate;
  }

  get terminationDate(): Date | undefined {
    return this.props.terminationDate;
  }

  get status(): EmployeeStatus {
    return this.props.status;
  }

  get baseSalary(): number {
    return this.props.baseSalary;
  }

  get contractType(): ContractType {
    return this.props.contractType;
  }

  get workRegime(): WorkRegime {
    return this.props.workRegime;
  }

  get weeklyHours(): number {
    return this.props.weeklyHours;
  }

  get photoUrl(): string | undefined {
    return this.props.photoUrl;
  }

  get metadata(): Record<string, unknown> {
    return this.props.metadata;
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
  isActive(): boolean {
    return this.status.isActive();
  }

  hasUserAccount(): boolean {
    return this.userId !== undefined;
  }

  isTerminated(): boolean {
    return this.status.isTerminated();
  }

  canWork(): boolean {
    return this.status.canWork() && !this.isTerminated();
  }

  hasEmploymentRights(): boolean {
    return this.contractType.hasEmploymentRights();
  }

  requiresTimeTracking(): boolean {
    return this.workRegime.requiresTimeTracking();
  }

  // Domain methods
  terminate(terminationDate: Date): void {
    if (this.isTerminated()) {
      throw new Error('Employee is already terminated');
    }

    this.props.status = EmployeeStatus.TERMINATED();
    this.props.terminationDate = terminationDate;
    this.props.updatedAt = new Date();
  }

  changeStatus(newStatus: EmployeeStatus): void {
    if (this.isTerminated() && !newStatus.isTerminated()) {
      throw new Error('Cannot change status of terminated employee');
    }

    this.props.status = newStatus;
    this.props.updatedAt = new Date();
  }

  updateSalary(newSalary: number): void {
    if (newSalary <= 0) {
      throw new Error('Salary must be greater than zero');
    }

    this.props.baseSalary = newSalary;
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  private constructor(props: EmployeeProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<EmployeeProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): Employee {
    const now = new Date();

    return new Employee(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }
}
