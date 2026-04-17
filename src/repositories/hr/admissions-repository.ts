export interface AdmissionInviteRecord {
  id: string;
  tenantId: string;
  token: string;
  email?: string | null;
  phone?: string | null;
  fullName: string;
  positionId?: string | null;
  departmentId?: string | null;
  companyId?: string | null;
  expectedStartDate?: Date | null;
  salary?: number | null;
  contractType?: string | null;
  workRegime?: string | null;
  status: string;
  candidateData?: Record<string, unknown> | null;
  expiresAt?: Date | null;
  completedAt?: Date | null;
  employeeId?: string | null;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  documents?: AdmissionDocumentRecord[];
  signatures?: DigitalSignatureRecord[];
  position?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
}

export interface AdmissionDocumentRecord {
  id: string;
  admissionInviteId: string;
  tenantId: string;
  type: string;
  fileName: string;
  fileUrl: string;
  status: string;
  rejectionReason?: string | null;
  validatedBy?: string | null;
  validatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DigitalSignatureRecord {
  id: string;
  tenantId: string;
  admissionInviteId?: string | null;
  documentId?: string | null;
  signerName: string;
  signerCpf?: string | null;
  signerEmail?: string | null;
  signedAt: Date;
  ipAddress: string;
  userAgent: string;
  documentHash: string;
  pinVerified: boolean;
  signatureType: string;
}

export interface CreateAdmissionInviteData {
  tenantId: string;
  email?: string;
  phone?: string;
  fullName: string;
  positionId?: string;
  departmentId?: string;
  companyId?: string;
  expectedStartDate?: Date;
  salary?: number;
  contractType?: string;
  workRegime?: string;
  expiresAt?: Date;
  createdBy?: string;
}

export interface UpdateAdmissionInviteData {
  id: string;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
  email?: string | null;
  phone?: string | null;
  fullName?: string;
  positionId?: string | null;
  departmentId?: string | null;
  companyId?: string | null;
  expectedStartDate?: Date | null;
  salary?: number | null;
  contractType?: string | null;
  workRegime?: string | null;
  expiresAt?: Date | null;
  status?: string;
  candidateData?: Record<string, unknown> | null;
  completedAt?: Date | null;
  employeeId?: string | null;
}

export interface FindAdmissionInviteFilters {
  status?: string;
  search?: string;
}

export interface PaginatedAdmissionInvitesResult {
  invites: AdmissionInviteRecord[];
  total: number;
}

export interface CreateDigitalSignatureData {
  tenantId: string;
  admissionInviteId: string;
  documentId?: string;
  signerName: string;
  signerCpf?: string;
  signerEmail?: string;
  ipAddress: string;
  userAgent: string;
  documentHash: string;
  pinVerified?: boolean;
  signatureType: string;
}

export interface AdmissionStatusCount {
  status: string;
  count: number;
}

export interface AdmissionsRepository {
  create(data: CreateAdmissionInviteData): Promise<AdmissionInviteRecord>;

  findById(id: string, tenantId: string): Promise<AdmissionInviteRecord | null>;

  findByToken(token: string): Promise<AdmissionInviteRecord | null>;

  findMany(
    tenantId: string,
    filters: FindAdmissionInviteFilters,
    skip: number,
    take: number,
  ): Promise<PaginatedAdmissionInvitesResult>;

  update(
    data: UpdateAdmissionInviteData,
  ): Promise<AdmissionInviteRecord | null>;

  delete(id: string, tenantId?: string): Promise<void>;

  countByStatus(tenantId: string): Promise<AdmissionStatusCount[]>;

  createSignature(
    data: CreateDigitalSignatureData,
  ): Promise<DigitalSignatureRecord>;
}
