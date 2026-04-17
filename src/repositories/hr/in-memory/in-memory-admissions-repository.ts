import { randomUUID } from 'node:crypto';
import type {
  AdmissionInviteRecord,
  AdmissionsRepository,
  AdmissionStatusCount,
  CreateAdmissionInviteData,
  CreateDigitalSignatureData,
  DigitalSignatureRecord,
  FindAdmissionInviteFilters,
  PaginatedAdmissionInvitesResult,
  UpdateAdmissionInviteData,
} from '../admissions-repository';

export class InMemoryAdmissionsRepository implements AdmissionsRepository {
  public invites: AdmissionInviteRecord[] = [];
  public signatures: DigitalSignatureRecord[] = [];

  async create(
    data: CreateAdmissionInviteData,
  ): Promise<AdmissionInviteRecord> {
    const invite: AdmissionInviteRecord = {
      id: randomUUID(),
      tenantId: data.tenantId,
      token: randomUUID(),
      email: data.email ?? null,
      phone: data.phone ?? null,
      fullName: data.fullName,
      positionId: data.positionId ?? null,
      departmentId: data.departmentId ?? null,
      companyId: data.companyId ?? null,
      expectedStartDate: data.expectedStartDate ?? null,
      salary: data.salary ?? null,
      contractType: data.contractType ?? 'CLT',
      workRegime: data.workRegime ?? 'FULL_TIME',
      status: 'PENDING',
      candidateData: null,
      expiresAt: data.expiresAt ?? null,
      completedAt: null,
      employeeId: null,
      createdBy: data.createdBy ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      documents: [],
      signatures: [],
    };

    this.invites.push(invite);
    return invite;
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<AdmissionInviteRecord | null> {
    return (
      this.invites.find(
        (invite) => invite.id === id && invite.tenantId === tenantId,
      ) ?? null
    );
  }

  async findByToken(token: string): Promise<AdmissionInviteRecord | null> {
    return this.invites.find((invite) => invite.token === token) ?? null;
  }

  async findMany(
    tenantId: string,
    filters: FindAdmissionInviteFilters,
    skip: number,
    take: number,
  ): Promise<PaginatedAdmissionInvitesResult> {
    let filtered = this.invites.filter(
      (invite) => invite.tenantId === tenantId,
    );

    if (filters.status) {
      filtered = filtered.filter((invite) => invite.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (invite) =>
          invite.fullName.toLowerCase().includes(searchLower) ||
          invite.email?.toLowerCase().includes(searchLower),
      );
    }

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = filtered.length;
    const invites = filtered.slice(skip, skip + take);

    return { invites, total };
  }

  async update(
    data: UpdateAdmissionInviteData,
  ): Promise<AdmissionInviteRecord | null> {
    const index = this.invites.findIndex((invite) => invite.id === data.id);
    if (index === -1) return null;

    const existing = this.invites[index];
    const updated: AdmissionInviteRecord = {
      ...existing,
      email: data.email !== undefined ? data.email : existing.email,
      phone: data.phone !== undefined ? data.phone : existing.phone,
      fullName: data.fullName ?? existing.fullName,
      positionId:
        data.positionId !== undefined ? data.positionId : existing.positionId,
      departmentId:
        data.departmentId !== undefined
          ? data.departmentId
          : existing.departmentId,
      companyId:
        data.companyId !== undefined ? data.companyId : existing.companyId,
      expectedStartDate:
        data.expectedStartDate !== undefined
          ? data.expectedStartDate
          : existing.expectedStartDate,
      salary: data.salary !== undefined ? data.salary : existing.salary,
      contractType:
        data.contractType !== undefined
          ? data.contractType
          : existing.contractType,
      workRegime:
        data.workRegime !== undefined ? data.workRegime : existing.workRegime,
      expiresAt:
        data.expiresAt !== undefined ? data.expiresAt : existing.expiresAt,
      status: data.status ?? existing.status,
      candidateData:
        data.candidateData !== undefined
          ? data.candidateData
          : existing.candidateData,
      completedAt:
        data.completedAt !== undefined
          ? data.completedAt
          : existing.completedAt,
      employeeId:
        data.employeeId !== undefined ? data.employeeId : existing.employeeId,
      updatedAt: new Date(),
    };

    this.invites[index] = updated;
    return updated;
  }

  async delete(id: string, _tenantId?: string): Promise<void> {
    this.invites = this.invites.filter((invite) => invite.id !== id);
  }

  async countByStatus(tenantId: string): Promise<AdmissionStatusCount[]> {
    const tenantInvites = this.invites.filter(
      (invite) => invite.tenantId === tenantId,
    );

    const statusMap = new Map<string, number>();
    for (const invite of tenantInvites) {
      const current = statusMap.get(invite.status) ?? 0;
      statusMap.set(invite.status, current + 1);
    }

    return Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));
  }

  async createSignature(
    data: CreateDigitalSignatureData,
  ): Promise<DigitalSignatureRecord> {
    const signature: DigitalSignatureRecord = {
      id: randomUUID(),
      tenantId: data.tenantId,
      admissionInviteId: data.admissionInviteId,
      documentId: data.documentId ?? null,
      signerName: data.signerName,
      signerCpf: data.signerCpf ?? null,
      signerEmail: data.signerEmail ?? null,
      signedAt: new Date(),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      documentHash: data.documentHash,
      pinVerified: data.pinVerified ?? false,
      signatureType: data.signatureType,
    };

    this.signatures.push(signature);

    // Attach to invite
    const invite = this.invites.find(
      (inv) => inv.id === data.admissionInviteId,
    );
    if (invite) {
      invite.signatures = invite.signatures ?? [];
      invite.signatures.push(signature);
    }

    return signature;
  }
}
