import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  PIS,
  WorkRegime,
} from './value-objects';

export interface EmergencyContactInfo {
  name?: string;
  phone?: string;
  alternativePhone?: string;
  relationship?: string;
}

export interface HealthCondition {
  description: string;
  requiresAttention: boolean;
}

export interface EmployeeProps {
  tenantId: UniqueEntityID;
  registrationNumber: string;
  userId?: UniqueEntityID;
  fullName: string;
  socialName?: string;
  birthDate?: Date;
  gender?: string;
  pcd: boolean;
  maritalStatus?: string;
  nationality?: string;
  birthPlace?: string;
  emergencyContactInfo?: EmergencyContactInfo;
  healthConditions?: HealthCondition[];
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
  companyId?: UniqueEntityID;
  hireDate: Date;
  terminationDate?: Date;
  status: EmployeeStatus;
  baseSalary?: number;
  contractType: ContractType;
  workRegime: WorkRegime;
  weeklyHours: number;
  photoUrl?: string;
  isPregnant: boolean;
  pregnancyStartDate?: Date;
  childBirthDate?: Date;
  metadata: Record<string, unknown>;
  pendingIssues: string[];
  // Phase 5 — kiosk badge QR token (D-15) + PIN fallback (D-08)
  qrTokenHash?: string | null;
  qrTokenSetAt?: Date | null;
  punchPinHash?: string | null;
  punchPinSetAt?: Date | null;
  punchPinLockedUntil?: Date | null;
  punchPinFailedAttempts?: number;
  punchPinLastFailedAt?: Date | null;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Employee extends Entity<EmployeeProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

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

  get pcd(): boolean {
    return this.props.pcd;
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

  get emergencyContactInfo(): EmergencyContactInfo | undefined {
    return this.props.emergencyContactInfo;
  }

  get healthConditions(): HealthCondition[] | undefined {
    return this.props.healthConditions;
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

  get companyId(): UniqueEntityID | undefined {
    return this.props.companyId;
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

  get baseSalary(): number | undefined {
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

  get isPregnant(): boolean {
    return this.props.isPregnant;
  }

  get pregnancyStartDate(): Date | undefined {
    return this.props.pregnancyStartDate;
  }

  get childBirthDate(): Date | undefined {
    return this.props.childBirthDate;
  }

  get metadata(): Record<string, unknown> {
    return this.props.metadata;
  }

  get pendingIssues(): string[] {
    return this.props.pendingIssues;
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

  // Phase 5 — Kiosk badge QR + PIN fallback getters
  get qrTokenHash(): string | null {
    return this.props.qrTokenHash ?? null;
  }

  get qrTokenSetAt(): Date | null {
    return this.props.qrTokenSetAt ?? null;
  }

  get punchPinHash(): string | null {
    return this.props.punchPinHash ?? null;
  }

  get punchPinSetAt(): Date | null {
    return this.props.punchPinSetAt ?? null;
  }

  get punchPinLockedUntil(): Date | null {
    return this.props.punchPinLockedUntil ?? null;
  }

  get punchPinFailedAttempts(): number {
    return this.props.punchPinFailedAttempts ?? 0;
  }

  get punchPinLastFailedAt(): Date | null {
    return this.props.punchPinLastFailedAt ?? null;
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

  updatePendingIssues(pendingIssues: string[]): void {
    this.props.pendingIssues = pendingIssues;
    this.props.updatedAt = new Date();
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Replaces every PII property with anonymized placeholder values, preserving
   * only fiscal-relevant fields (registration number, hire/termination dates,
   * salary, contract type) so that payroll, audit and eSocial relations
   * remain intact for the legal retention period (LGPD Art. 18 VI).
   *
   * The CPF is replaced with a hashed placeholder built via
   * {@link CPF.fromAnonymizedHash} so the unique constraint on `cpfHash`
   * keeps holding without exposing the original document.
   */
  anonymize(params: {
    cpf: CPF;
    anonymizedAt: Date;
    anonymizedByUserId: string;
    reason?: string;
  }): void {
    const placeholder = 'REDACTED';

    this.props.cpf = params.cpf;
    this.props.fullName = `${placeholder} ${placeholder}`;
    this.props.socialName = undefined;
    this.props.userId = undefined;
    this.props.email = undefined;
    this.props.personalEmail = undefined;
    this.props.phone = undefined;
    this.props.mobilePhone = undefined;
    this.props.emergencyContact = undefined;
    this.props.emergencyPhone = undefined;
    this.props.emergencyContactInfo = undefined;
    this.props.healthConditions = undefined;
    this.props.rg = undefined;
    this.props.rgIssuer = undefined;
    this.props.rgIssueDate = undefined;
    this.props.pis = undefined;
    this.props.ctpsNumber = undefined;
    this.props.ctpsSeries = undefined;
    this.props.ctpsState = undefined;
    this.props.voterTitle = undefined;
    this.props.militaryDoc = undefined;
    this.props.address = undefined;
    this.props.addressNumber = undefined;
    this.props.complement = undefined;
    this.props.neighborhood = undefined;
    this.props.city = undefined;
    this.props.state = undefined;
    this.props.zipCode = undefined;
    this.props.birthDate = undefined;
    this.props.birthPlace = undefined;
    this.props.maritalStatus = undefined;
    this.props.nationality = undefined;
    this.props.gender = undefined;
    this.props.photoUrl = undefined;
    this.props.bankCode = undefined;
    this.props.bankName = undefined;
    this.props.bankAgency = undefined;
    this.props.bankAccount = undefined;
    this.props.bankAccountType = undefined;
    this.props.pixKey = undefined;
    this.props.metadata = {
      ...this.props.metadata,
      anonymized: true,
      anonymizedAt: params.anonymizedAt.toISOString(),
      anonymizedByUserId: params.anonymizedByUserId,
      anonymizationReason: params.reason ?? 'LGPD Art. 18 VI',
    };
    this.props.deletedAt = params.anonymizedAt;
    this.props.updatedAt = params.anonymizedAt;
  }

  get isAnonymized(): boolean {
    return this.props.metadata?.anonymized === true;
  }

  private constructor(props: EmployeeProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<EmployeeProps, 'createdAt' | 'updatedAt' | 'isPregnant'> &
      Partial<Pick<EmployeeProps, 'createdAt' | 'updatedAt' | 'isPregnant'>>,
    id?: UniqueEntityID,
  ): Employee {
    const now = new Date();
    const createdAt = props.createdAt ?? now;
    const updatedAt = props.updatedAt ?? now;

    return new Employee(
      {
        ...props,
        isPregnant: props.isPregnant ?? false,
        pendingIssues: props.pendingIssues ?? [],
        createdAt,
        updatedAt,
      },
      id,
    );
  }
}
