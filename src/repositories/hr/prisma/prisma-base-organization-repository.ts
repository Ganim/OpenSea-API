import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  Organization,
  OrganizationType,
  TaxRegime,
  OrganizationStatus,
} from '@/entities/hr/organization';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/generated/client.js';
import { getFieldCipherService } from '@/services/security/field-cipher-service';
import { ENCRYPTED_FIELD_CONFIG } from '@/services/security/encrypted-field-config';
import type {
  BaseOrganizationRepository,
  CreateOrganizationSchema,
  FindManyOrganizationsParams,
  FindManyOrganizationsResult,
  UpdateOrganizationSchema,
} from '../base-organization-repository';

const orgEncConfig = ENCRYPTED_FIELD_CONFIG.Organization;
const fiscalEncConfig = ENCRYPTED_FIELD_CONFIG.OrganizationFiscalSettings;
const stakeholderEncConfig = ENCRYPTED_FIELD_CONFIG.OrganizationStakeholder;

function tryGetCipher() {
  try {
    return getFieldCipherService();
  } catch {
    return null;
  }
}

function decryptOrganizationData<T extends Record<string, unknown>>(
  data: T,
): T {
  const cipher = tryGetCipher();
  if (!cipher) return data;
  const decrypted = cipher.decryptFields(data, orgEncConfig.encryptedFields);
  Object.assign(data, decrypted);

  // Decrypt related fiscal settings if loaded via include
  if (Array.isArray(data.fiscalSettings)) {
    for (const fs of data.fiscalSettings) {
      if (fs && typeof fs === 'object') {
        const decryptedFs = cipher.decryptFields(
          fs as Record<string, unknown>,
          fiscalEncConfig.encryptedFields,
        );
        Object.assign(fs, decryptedFs);
      }
    }
  }

  // Decrypt related stakeholders if loaded via include
  if (Array.isArray(data.stakeholders)) {
    for (const sh of data.stakeholders) {
      if (sh && typeof sh === 'object') {
        const decryptedSh = cipher.decryptFields(
          sh as Record<string, unknown>,
          stakeholderEncConfig.encryptedFields,
        );
        Object.assign(sh, decryptedSh);
      }
    }
  }

  return data;
}

export abstract class PrismaBaseOrganizationRepository<T extends Organization>
  implements BaseOrganizationRepository<T>
{
  protected abstract readonly organizationType: OrganizationType;
  protected abstract toDomain(data: Record<string, unknown>): T;
  protected abstract fromDomain(
    organization: T,
  ): Prisma.OrganizationUpdateInput;

  async create(data: CreateOrganizationSchema): Promise<T> {
    const cipher = tryGetCipher();

    const createData: Record<string, unknown> = {
      tenantId: data.tenantId,
      type: this.organizationType,
      legalName: data.legalName,
      cnpj: data.cnpj ?? null,
      cpf: data.cpf ?? null,
      tradeName: data.tradeName ?? null,
      stateRegistration: data.stateRegistration ?? null,
      municipalRegistration: data.municipalRegistration ?? null,
      taxRegime: (data.taxRegime as TaxRegime | undefined) ?? null,
      status: (data.status ?? 'ACTIVE') as OrganizationStatus,
      email: data.email ?? null,
      phoneMain: data.phoneMain ?? null,
      website: data.website ?? null,
      typeSpecificData: (data.typeSpecificData ?? {}) as Prisma.InputJsonValue,
      metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
    };

    if (cipher) {
      // Encrypt sensitive fields
      for (const field of orgEncConfig.encryptedFields) {
        if (
          createData[field] !== null &&
          createData[field] !== undefined &&
          typeof createData[field] === 'string'
        ) {
          createData[field] = cipher.encrypt(createData[field] as string);
        }
      }

      // Generate blind index hashes from ORIGINAL plaintext values
      const hashes = cipher.generateHashes(
        { cnpj: data.cnpj ?? undefined, cpf: data.cpf ?? undefined },
        orgEncConfig.hashFields,
      );
      Object.assign(createData, hashes);
    }

    const organizationData = await prisma.organization.create({
      data: createData as Parameters<
        typeof prisma.organization.create
      >[0]['data'],
    });

    decryptOrganizationData(
      organizationData as unknown as Record<string, unknown>,
    );

    return this.toDomain(organizationData);
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<T | null> {
    const organizationData = await prisma.organization.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        type: this.organizationType,
        deletedAt: null,
      },
      include: {
        addresses: {
          where: { deletedAt: null },
          orderBy: { isPrimary: 'desc' },
        },
        cnaes: {
          where: { deletedAt: null },
          orderBy: { isPrimary: 'desc' },
        },
        fiscalSettings: {
          where: { deletedAt: null },
        },
        stakeholders: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!organizationData) return null;

    decryptOrganizationData(
      organizationData as unknown as Record<string, unknown>,
    );

    return this.toDomain(organizationData);
  }

  async findByCnpj(cnpj: string, includeDeleted = false): Promise<T | null> {
    const cipher = tryGetCipher();

    // Use blind index hash for lookup when encryption is available
    const whereClause: Record<string, unknown> = {
      type: this.organizationType,
      ...(includeDeleted ? {} : { deletedAt: null }),
    };

    if (cipher) {
      const cnpjHash = cipher.blindIndex(cnpj);
      whereClause.cnpjHash = cnpjHash;
    } else {
      whereClause.cnpj = cnpj;
    }

    const organizationData = await prisma.organization.findFirst({
      where: whereClause as Prisma.OrganizationWhereInput,
    });

    if (!organizationData) return null;

    decryptOrganizationData(
      organizationData as unknown as Record<string, unknown>,
    );

    return this.toDomain(organizationData);
  }

  async findByCpf(cpf: string, includeDeleted = false): Promise<T | null> {
    const cipher = tryGetCipher();

    // Use blind index hash for lookup when encryption is available
    const whereClause: Record<string, unknown> = {
      type: this.organizationType,
      ...(includeDeleted ? {} : { deletedAt: null }),
    };

    if (cipher) {
      const cpfHash = cipher.blindIndex(cpf);
      whereClause.cpfHash = cpfHash;
    } else {
      whereClause.cpf = cpf;
    }

    const organizationData = await prisma.organization.findFirst({
      where: whereClause as Prisma.OrganizationWhereInput,
    });

    if (!organizationData) return null;

    decryptOrganizationData(
      organizationData as unknown as Record<string, unknown>,
    );

    return this.toDomain(organizationData);
  }

  async findMany(
    params: FindManyOrganizationsParams,
  ): Promise<FindManyOrganizationsResult<T>> {
    const {
      tenantId,
      page = 1,
      perPage = 20,
      search,
      includeDeleted = false,
      status,
    } = params;

    const where: Prisma.OrganizationWhereInput = {
      tenantId,
      type: this.organizationType,
    };

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (status) {
      where.status = status as Prisma.EnumOrganizationStatusEnumFilter;
    }

    if (search) {
      where.OR = [
        { legalName: { contains: search, mode: 'insensitive' } },
        { tradeName: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.organization.count({ where }),
    ]);

    const organizationDomains = organizations.map((data) => {
      decryptOrganizationData(data as unknown as Record<string, unknown>);
      return this.toDomain(data);
    });

    return { organizations: organizationDomains, total };
  }

  async findManyActive(): Promise<T[]> {
    const organizations = await prisma.organization.findMany({
      where: {
        type: this.organizationType,
        status: 'ACTIVE',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return organizations.map((data) => {
      decryptOrganizationData(data as unknown as Record<string, unknown>);
      return this.toDomain(data);
    });
  }

  async findManyInactive(): Promise<T[]> {
    const organizations = await prisma.organization.findMany({
      where: {
        type: this.organizationType,
        deletedAt: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });

    return organizations.map((data) => {
      decryptOrganizationData(data as unknown as Record<string, unknown>);
      return this.toDomain(data);
    });
  }

  async update(data: UpdateOrganizationSchema): Promise<T | null> {
    const organization = await this.findById(data.id, data.tenantId);
    if (!organization) {
      return null;
    }

    // Atualizar campos principais
    organization.updateMainData({
      tradeName:
        data.tradeName !== undefined
          ? (data.tradeName ?? undefined)
          : organization.tradeName,
      stateRegistration:
        data.stateRegistration !== undefined
          ? (data.stateRegistration ?? undefined)
          : organization.stateRegistration,
      municipalRegistration:
        data.municipalRegistration !== undefined
          ? (data.municipalRegistration ?? undefined)
          : organization.municipalRegistration,
      taxRegime:
        data.taxRegime !== undefined
          ? ((data.taxRegime as TaxRegime | null) ?? undefined)
          : organization.taxRegime,
      email:
        data.email !== undefined
          ? (data.email ?? undefined)
          : organization.email,
      phoneMain:
        data.phoneMain !== undefined
          ? (data.phoneMain ?? undefined)
          : organization.phoneMain,
      website:
        data.website !== undefined
          ? (data.website ?? undefined)
          : organization.website,
    });

    if (data.legalName !== undefined) {
      organization.props.legalName = data.legalName;
      organization.props.updatedAt = new Date();
    }

    // Atualizar status se fornecido
    if (data.status !== undefined) {
      organization.changeStatus(data.status as OrganizationStatus);
    }

    // Atualizar typeSpecificData
    if (data.typeSpecificData !== undefined) {
      organization.updateTypeSpecificData(
        data.typeSpecificData as Record<string, unknown>,
      );
    }

    // Atualizar metadata
    if (data.metadata !== undefined) {
      organization.updateMetadata(data.metadata as Record<string, unknown>);
    }

    await this.save(organization);

    return organization;
  }

  async save(organization: T): Promise<void> {
    const domainData = this.fromDomain(organization);
    const cipher = tryGetCipher();

    // The domainData comes from fromDomain() which contains plaintext field values.
    // We need to encrypt the sensitive fields before writing to the database.
    const saveData: Record<string, unknown> = {
      ...(domainData as Record<string, unknown>),
      updatedAt: organization.updatedAt,
    };

    if (cipher) {
      // Encrypt sensitive fields in the save data
      for (const field of orgEncConfig.encryptedFields) {
        if (
          saveData[field] !== null &&
          saveData[field] !== undefined &&
          typeof saveData[field] === 'string'
        ) {
          saveData[field] = cipher.encrypt(saveData[field] as string);
        }
      }

      // Regenerate blind index hashes from plaintext values (from domain entity)
      const hashes = cipher.generateHashes(
        {
          cnpj: organization.cnpj ?? undefined,
          cpf: organization.cpf ?? undefined,
        },
        orgEncConfig.hashFields,
      );
      Object.assign(saveData, hashes);
    }

    await prisma.organization.update({
      where: {
        id: organization.id.toString(),
      },
      data: saveData as Prisma.OrganizationUpdateInput,
    });
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const organization = await this.findById(id, tenantId);
    if (organization) {
      organization.delete();
      await this.save(organization);
    }
  }

  async restore(id: UniqueEntityID, tenantId: string): Promise<void> {
    const organization = await prisma.organization.findFirst({
      where: { id: id.toString(), tenantId, type: this.organizationType },
    });

    if (organization && organization.deletedAt) {
      await prisma.organization.update({
        where: { id: id.toString() },
        data: { deletedAt: null, updatedAt: new Date() },
      });
    }
  }
}
