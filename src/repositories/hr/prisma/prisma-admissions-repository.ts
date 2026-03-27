import { prisma } from '@/lib/prisma';
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

function mapPrismaToRecord(
  raw: Record<string, unknown>,
): AdmissionInviteRecord {
  return {
    id: raw.id as string,
    tenantId: raw.tenantId as string,
    token: raw.token as string,
    email: (raw.email as string) ?? null,
    phone: (raw.phone as string) ?? null,
    fullName: raw.fullName as string,
    positionId: (raw.positionId as string) ?? null,
    departmentId: (raw.departmentId as string) ?? null,
    companyId: (raw.companyId as string) ?? null,
    expectedStartDate: (raw.expectedStartDate as Date) ?? null,
    salary: raw.salary ? Number(raw.salary) : null,
    contractType: (raw.contractType as string) ?? null,
    workRegime: (raw.workRegime as string) ?? null,
    status: raw.status as string,
    candidateData: (raw.candidateData as Record<string, unknown>) ?? null,
    expiresAt: (raw.expiresAt as Date) ?? null,
    completedAt: (raw.completedAt as Date) ?? null,
    employeeId: (raw.employeeId as string) ?? null,
    createdBy: (raw.createdBy as string) ?? null,
    createdAt: raw.createdAt as Date,
    updatedAt: raw.updatedAt as Date,
    documents: Array.isArray(raw.documents)
      ? (raw.documents as AdmissionInviteRecord['documents'])
      : undefined,
    signatures: Array.isArray(raw.signatures)
      ? (raw.signatures as AdmissionInviteRecord['signatures'])
      : undefined,
  };
}

export class PrismaAdmissionsRepository implements AdmissionsRepository {
  async create(
    data: CreateAdmissionInviteData,
  ): Promise<AdmissionInviteRecord> {
    const created = await prisma.admissionInvite.create({
      data: {
        tenantId: data.tenantId,
        email: data.email,
        phone: data.phone,
        fullName: data.fullName,
        positionId: data.positionId,
        departmentId: data.departmentId,
        companyId: data.companyId,
        expectedStartDate: data.expectedStartDate,
        salary: data.salary,
        contractType: data.contractType ?? 'CLT',
        workRegime: data.workRegime ?? 'FULL_TIME',
        expiresAt: data.expiresAt,
        createdBy: data.createdBy,
      },
      include: {
        documents: true,
        signatures: true,
      },
    });

    return mapPrismaToRecord(created as unknown as Record<string, unknown>);
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<AdmissionInviteRecord | null> {
    const found = await prisma.admissionInvite.findFirst({
      where: { id, tenantId },
      include: {
        documents: true,
        signatures: true,
      },
    });

    if (!found) return null;
    return mapPrismaToRecord(found as unknown as Record<string, unknown>);
  }

  async findByToken(token: string): Promise<AdmissionInviteRecord | null> {
    const found = await prisma.admissionInvite.findUnique({
      where: { token },
      include: {
        documents: true,
        signatures: true,
      },
    });

    if (!found) return null;
    return mapPrismaToRecord(found as unknown as Record<string, unknown>);
  }

  async findMany(
    tenantId: string,
    filters: FindAdmissionInviteFilters,
    skip: number,
    take: number,
  ): Promise<PaginatedAdmissionInvitesResult> {
    const where: Record<string, unknown> = { tenantId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [rawInvites, total] = await Promise.all([
      prisma.admissionInvite.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          documents: true,
          signatures: true,
        },
      }),
      prisma.admissionInvite.count({ where }),
    ]);

    const invites = rawInvites.map((raw) =>
      mapPrismaToRecord(raw as unknown as Record<string, unknown>),
    );

    return { invites, total };
  }

  async update(
    data: UpdateAdmissionInviteData,
  ): Promise<AdmissionInviteRecord | null> {
    const updateData: Record<string, unknown> = {};

    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.positionId !== undefined) updateData.positionId = data.positionId;
    if (data.departmentId !== undefined)
      updateData.departmentId = data.departmentId;
    if (data.companyId !== undefined) updateData.companyId = data.companyId;
    if (data.expectedStartDate !== undefined)
      updateData.expectedStartDate = data.expectedStartDate;
    if (data.salary !== undefined) updateData.salary = data.salary;
    if (data.contractType !== undefined)
      updateData.contractType = data.contractType;
    if (data.workRegime !== undefined) updateData.workRegime = data.workRegime;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.candidateData !== undefined)
      updateData.candidateData = data.candidateData;
    if (data.completedAt !== undefined)
      updateData.completedAt = data.completedAt;
    if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;

    try {
      const updated = await prisma.admissionInvite.update({
        where: { id: data.id },
        data: updateData,
        include: {
          documents: true,
          signatures: true,
        },
      });

      return mapPrismaToRecord(updated as unknown as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    await prisma.admissionInvite.delete({
      where: { id },
    });
  }

  async countByStatus(tenantId: string): Promise<AdmissionStatusCount[]> {
    const results = await prisma.admissionInvite.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { status: true },
    });

    return results.map((row) => ({
      status: row.status,
      count: row._count.status,
    }));
  }

  async createSignature(
    data: CreateDigitalSignatureData,
  ): Promise<DigitalSignatureRecord> {
    const created = await prisma.digitalSignature.create({
      data: {
        tenantId: data.tenantId,
        admissionInviteId: data.admissionInviteId,
        documentId: data.documentId,
        signerName: data.signerName,
        signerCpf: data.signerCpf,
        signerEmail: data.signerEmail,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        documentHash: data.documentHash,
        pinVerified: data.pinVerified ?? false,
        signatureType: data.signatureType,
      },
    });

    return {
      id: created.id,
      tenantId: created.tenantId,
      admissionInviteId: created.admissionInviteId,
      documentId: created.documentId,
      signerName: created.signerName,
      signerCpf: created.signerCpf,
      signerEmail: created.signerEmail,
      signedAt: created.signedAt,
      ipAddress: created.ipAddress,
      userAgent: created.userAgent,
      documentHash: created.documentHash,
      pinVerified: created.pinVerified,
      signatureType: created.signatureType,
    };
  }
}
