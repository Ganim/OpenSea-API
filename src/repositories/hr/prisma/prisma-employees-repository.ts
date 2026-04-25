import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { Employee } from '@/entities/hr/employee';
import { ANONYMIZED_CPF_PREFIX } from '@/entities/hr/value-objects/cpf';
import { prisma, Prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import { mapEmployeePrismaToDomain } from '@/mappers/hr/employee/employee-prisma-to-domain';
import { getFieldCipherService } from '@/services/security/field-cipher-service';
import { ENCRYPTED_FIELD_CONFIG } from '@/services/security/encrypted-field-config';
import type {
  AnonymizeEmployeeSchema,
  CrachasPaginatedResult,
  CreateEmployeeSchema,
  EmployeesRepository,
  EmployeeWithRawRelations,
  FindCrachasFilters,
  FindEmployeeFilters,
  PaginatedEmployeesResult,
  UpdateEmployeeSchema,
} from '../employees-repository';

const encConfig = ENCRYPTED_FIELD_CONFIG.Employee;

function tryGetCipher() {
  try {
    return getFieldCipherService();
  } catch {
    return null;
  }
}

function decryptEmployeeData<T extends Record<string, unknown>>(data: T): T {
  const cipher = tryGetCipher();
  if (!cipher) return data;
  const decrypted = cipher.decryptFields(data, encConfig.encryptedFields);
  return Object.assign(data, decrypted) as T;
}

export class PrismaEmployeesRepository implements EmployeesRepository {
  async create(
    data: CreateEmployeeSchema,
    tx?: TransactionClient,
  ): Promise<Employee> {
    const prismaData: Record<string, unknown> = {
      tenantId: data.tenantId,
      registrationNumber: data.registrationNumber,
      userId: data.userId?.toString(),
      fullName: data.fullName,
      socialName: data.socialName,
      birthDate: data.birthDate,
      gender: data.gender,
      pcd: data.pcd ?? false,
      maritalStatus: data.maritalStatus,
      nationality: data.nationality,
      birthPlace: data.birthPlace,
      emergencyContactInfo: data.emergencyContactInfo
        ? JSON.parse(JSON.stringify(data.emergencyContactInfo))
        : undefined,
      healthConditions: data.healthConditions
        ? JSON.parse(JSON.stringify(data.healthConditions))
        : undefined,
      cpf: data.cpf.value,
      rg: data.rg,
      rgIssuer: data.rgIssuer,
      rgIssueDate: data.rgIssueDate,
      pis: data.pis?.value,
      ctpsNumber: data.ctpsNumber,
      ctpsSeries: data.ctpsSeries,
      ctpsState: data.ctpsState,
      voterTitle: data.voterTitle,
      militaryDoc: data.militaryDoc,
      email: data.email,
      personalEmail: data.personalEmail,
      phone: data.phone,
      mobilePhone: data.mobilePhone,
      emergencyContact: data.emergencyContact,
      emergencyPhone: data.emergencyPhone,
      address: data.address,
      addressNumber: data.addressNumber,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      country: data.country,
      bankCode: data.bankCode,
      bankName: data.bankName,
      bankAgency: data.bankAgency,
      bankAccount: data.bankAccount,
      bankAccountType: data.bankAccountType,
      pixKey: data.pixKey,
      departmentId: data.departmentId?.toString(),
      positionId: data.positionId?.toString(),
      supervisorId: data.supervisorId?.toString(),
      companyId: data.companyId?.toString(),
      hireDate: data.hireDate,
      terminationDate: data.terminationDate,
      status: data.status.value,
      baseSalary: data.baseSalary,
      contractType: data.contractType.value,
      workRegime: data.workRegime.value,
      weeklyHours: data.weeklyHours,
      photoUrl: data.photoUrl,
      metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : {},
      pendingIssues: data.pendingIssues
        ? JSON.parse(JSON.stringify(data.pendingIssues))
        : [],
      shortId: data.shortId ?? null,
    };

    // Encrypt sensitive fields and generate blind index hashes
    const cipher = tryGetCipher();
    if (cipher) {
      const fieldsToEncrypt = encConfig.encryptedFields;
      for (const field of fieldsToEncrypt) {
        if (
          prismaData[field] !== null &&
          prismaData[field] !== undefined &&
          typeof prismaData[field] === 'string'
        ) {
          prismaData[field] = cipher.encrypt(prismaData[field] as string);
        }
      }
      // Generate blind index hashes from ORIGINAL (pre-encryption) plaintext values
      const hashes = cipher.generateHashes(
        {
          cpf: data.cpf.value,
          rg: data.rg,
          pis: data.pis?.value,
          pixKey: data.pixKey,
          bankAccount: data.bankAccount,
        },
        encConfig.hashFields,
      );
      Object.assign(prismaData, hashes);
    }

    const client = tx ?? prisma;
    const newEmployeeData = await client.employee.create({
      data: prismaData as Parameters<typeof prisma.employee.create>[0]['data'],
      include: {
        user: true,
        department: true,
        position: true,
        supervisor: true,
      },
    });

    // Decrypt before mapping to domain
    decryptEmployeeData(newEmployeeData as unknown as Record<string, unknown>);

    const employee = Employee.create(
      mapEmployeePrismaToDomain(newEmployeeData),
      new UniqueEntityID(newEmployeeData.id),
    );
    return employee;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
    includeDeleted = false,
  ): Promise<Employee | null> {
    const employeeData = await prisma.employee.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: includeDeleted ? undefined : null,
      },
      include: {
        user: true,
        department: true,
        position: true,
        supervisor: true,
      },
    });

    if (!employeeData) return null;

    decryptEmployeeData(employeeData as unknown as Record<string, unknown>);

    const employee = Employee.create(
      mapEmployeePrismaToDomain(employeeData),
      new UniqueEntityID(employeeData.id),
    );
    return employee;
  }

  async findByIdWithRelations(
    id: UniqueEntityID,
    tenantId: string,
    includeDeleted = false,
  ): Promise<EmployeeWithRawRelations | null> {
    const employeeData = await prisma.employee.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: includeDeleted ? undefined : null,
      },
      include: {
        user: true,
        department: true,
        position: true,
        supervisor: true,
        company: true,
      },
    });

    if (!employeeData) return null;

    decryptEmployeeData(employeeData as unknown as Record<string, unknown>);

    // mapEmployeePrismaToDomain expects the base includes (user, department, position, supervisor)
    // The extra company field is structurally compatible
    const employee = Employee.create(
      mapEmployeePrismaToDomain(
        employeeData as Parameters<typeof mapEmployeePrismaToDomain>[0],
      ),
      new UniqueEntityID(employeeData.id),
    );

    return {
      employee,
      rawRelations: {
        department: employeeData.department
          ? {
              id: employeeData.department.id,
              name: employeeData.department.name,
              code: employeeData.department.code,
            }
          : null,
        position: employeeData.position
          ? {
              id: employeeData.position.id,
              name: employeeData.position.name,
              level: employeeData.position.level,
            }
          : null,
        company: employeeData.company
          ? {
              id: employeeData.company.id,
              legalName: employeeData.company.legalName,
              tradeName: employeeData.company.tradeName ?? null,
            }
          : null,
      },
    };
  }

  async findByRegistrationNumber(
    registrationNumber: string,
    tenantId: string,
    includeDeleted = false,
  ): Promise<Employee | null> {
    const employeeData = await prisma.employee.findFirst({
      where: {
        registrationNumber,
        tenantId,
        deletedAt: includeDeleted ? undefined : null,
      },
      include: {
        user: true,
        department: true,
        position: true,
        supervisor: true,
      },
    });

    if (!employeeData) return null;

    decryptEmployeeData(employeeData as unknown as Record<string, unknown>);

    const employee = Employee.create(
      mapEmployeePrismaToDomain(employeeData),
      new UniqueEntityID(employeeData.id),
    );
    return employee;
  }

  async findByShortId(
    shortId: string,
    tenantId: string,
    includeDeleted = false,
  ): Promise<Employee | null> {
    const employeeData = await prisma.employee.findFirst({
      where: {
        // Defensive cast — `shortId` was added by the Emporion Plan A migration
        // (Task 1). Runtime is unaffected when the regenerated Prisma client
        // already exposes the column; the cast keeps us resilient across
        // intermediate tsc states shared between plans.
        shortId,
        tenantId,
        deletedAt: includeDeleted ? undefined : null,
      } as unknown as Prisma.EmployeeWhereInput,
      include: {
        user: true,
        department: true,
        position: true,
        supervisor: true,
      },
    });

    if (!employeeData) return null;

    decryptEmployeeData(employeeData as unknown as Record<string, unknown>);

    const employee = Employee.create(
      mapEmployeePrismaToDomain(employeeData),
      new UniqueEntityID(employeeData.id),
    );
    return employee;
  }

  async findByCpf(
    cpf: import('@/entities/hr/value-objects').CPF,
    tenantId: string,
    includeDeleted = false,
  ): Promise<Employee | null> {
    const cipher = tryGetCipher();

    // Use blind index hash for lookup when encryption is available
    const whereClause: Record<string, unknown> = {
      tenantId,
      deletedAt: includeDeleted ? undefined : null,
    };

    if (cipher) {
      const cpfHash = cipher.blindIndex(cpf.value);
      whereClause.cpfHash = cpfHash;
    } else {
      whereClause.cpf = cpf.value;
    }

    const employeeData = await prisma.employee.findFirst({
      where: whereClause as Prisma.EmployeeWhereInput,
      include: {
        user: true,
        department: true,
        position: true,
        supervisor: true,
      },
    });

    if (!employeeData) return null;

    decryptEmployeeData(employeeData as unknown as Record<string, unknown>);

    const employee = Employee.create(
      mapEmployeePrismaToDomain(employeeData),
      new UniqueEntityID(employeeData.id),
    );
    return employee;
  }

  async findByUserId(
    userId: UniqueEntityID,
    tenantId: string,
    includeDeleted = false,
  ): Promise<Employee | null> {
    const employeeData = await prisma.employee.findFirst({
      where: {
        userId: userId.toString(),
        tenantId,
        deletedAt: includeDeleted ? undefined : null,
      },
      include: {
        user: true,
        department: true,
        position: true,
        supervisor: true,
      },
    });

    if (!employeeData) return null;

    decryptEmployeeData(employeeData as unknown as Record<string, unknown>);

    const employee = Employee.create(
      mapEmployeePrismaToDomain(employeeData),
      new UniqueEntityID(employeeData.id),
    );
    return employee;
  }

  async findByUserIdAnyTenant(
    userId: UniqueEntityID,
  ): Promise<Employee | null> {
    const employeeData = await prisma.employee.findFirst({
      where: {
        userId: userId.toString(),
        deletedAt: null,
      },
      include: {
        user: true,
        department: true,
        position: true,
        supervisor: true,
      },
    });

    if (!employeeData) return null;

    decryptEmployeeData(employeeData as unknown as Record<string, unknown>);

    const employee = Employee.create(
      mapEmployeePrismaToDomain(employeeData),
      new UniqueEntityID(employeeData.id),
    );
    return employee;
  }

  async findByPis(
    pis: import('@/entities/hr/value-objects').PIS,
    tenantId: string,
    includeDeleted = false,
  ): Promise<Employee | null> {
    const cipher = tryGetCipher();

    // Use blind index hash for lookup when encryption is available
    const whereClause: Record<string, unknown> = {
      tenantId,
      deletedAt: includeDeleted ? undefined : null,
    };

    if (cipher) {
      const pisHash = cipher.blindIndex(pis.value);
      whereClause.pisHash = pisHash;
    } else {
      whereClause.pis = pis.value;
    }

    const employeeData = await prisma.employee.findFirst({
      where: whereClause as Prisma.EmployeeWhereInput,
      include: {
        user: true,
        department: true,
        position: true,
        supervisor: true,
      },
    });

    if (!employeeData) return null;

    decryptEmployeeData(employeeData as unknown as Record<string, unknown>);

    const employee = Employee.create(
      mapEmployeePrismaToDomain(employeeData),
      new UniqueEntityID(employeeData.id),
    );
    return employee;
  }

  async findMany(
    tenantId: string,
    includeDeleted = false,
  ): Promise<Employee[]> {
    const employeesData = await prisma.employee.findMany({
      where: { tenantId, deletedAt: includeDeleted ? undefined : null },
      orderBy: { fullName: 'asc' },
      include: {
        user: true,
        department: true,
        position: true,
        supervisor: true,
      },
    });

    return employeesData.map((employeeData) => {
      decryptEmployeeData(employeeData as unknown as Record<string, unknown>);
      return Employee.create(
        mapEmployeePrismaToDomain(employeeData),
        new UniqueEntityID(employeeData.id),
      );
    });
  }

  async findManyPaginated(
    tenantId: string,
    filters: FindEmployeeFilters,
    skip: number,
    take: number,
  ): Promise<PaginatedEmployeesResult> {
    const whereClause: Prisma.EmployeeWhereInput = {
      tenantId,
      deletedAt: filters.includeDeleted ? undefined : null,
      status: filters.status as Prisma.EmployeeWhereInput['status'],
      departmentId: filters.departmentId?.toString(),
      positionId: filters.positionId?.toString(),
      supervisorId: filters.supervisorId?.toString(),
      companyId: filters.companyId?.toString(),
    };

    if (filters.userId) {
      whereClause.userId = filters.userId;
    } else if (filters.unlinked) {
      whereClause.userId = null;
    }

    if (filters.search) {
      whereClause.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        {
          registrationNumber: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [employeesData, total] = await Promise.all([
      prisma.employee.findMany({
        where: whereClause,
        orderBy: { fullName: 'asc' },
        skip,
        take,
        include: {
          user: true,
          department: true,
          position: true,
          supervisor: true,
        },
      }),
      prisma.employee.count({ where: whereClause }),
    ]);

    const employees = employeesData.map((employeeData) => {
      decryptEmployeeData(employeeData as unknown as Record<string, unknown>);
      return Employee.create(
        mapEmployeePrismaToDomain(employeeData),
        new UniqueEntityID(employeeData.id),
      );
    });

    return { employees, total };
  }

  async findManyByStatus(
    status: import('@/entities/hr/value-objects').EmployeeStatus,
    tenantId: string,
    includeDeleted = false,
  ): Promise<Employee[]> {
    const employeesData = await prisma.employee.findMany({
      where: {
        status: status.value,
        tenantId,
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: { fullName: 'asc' },
      include: {
        user: true,
        department: true,
        position: true,
        supervisor: true,
      },
    });

    return employeesData.map((employeeData) => {
      decryptEmployeeData(employeeData as unknown as Record<string, unknown>);
      return Employee.create(
        mapEmployeePrismaToDomain(employeeData),
        new UniqueEntityID(employeeData.id),
      );
    });
  }

  async findManyByDepartment(
    departmentId: UniqueEntityID,
    tenantId: string,
    includeDeleted = false,
  ): Promise<Employee[]> {
    const employeesData = await prisma.employee.findMany({
      where: {
        departmentId: departmentId.toString(),
        tenantId,
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: { fullName: 'asc' },
      include: {
        user: true,
        department: true,
        position: true,
        supervisor: true,
      },
    });

    return employeesData.map((employeeData) => {
      decryptEmployeeData(employeeData as unknown as Record<string, unknown>);
      return Employee.create(
        mapEmployeePrismaToDomain(employeeData),
        new UniqueEntityID(employeeData.id),
      );
    });
  }

  async findManyByPosition(
    positionId: UniqueEntityID,
    tenantId: string,
    includeDeleted = false,
  ): Promise<Employee[]> {
    const employeesData = await prisma.employee.findMany({
      where: {
        positionId: positionId.toString(),
        tenantId,
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: { fullName: 'asc' },
      include: {
        user: true,
        department: true,
        position: true,
        supervisor: true,
      },
    });

    return employeesData.map((employeeData) => {
      decryptEmployeeData(employeeData as unknown as Record<string, unknown>);
      return Employee.create(
        mapEmployeePrismaToDomain(employeeData),
        new UniqueEntityID(employeeData.id),
      );
    });
  }

  async findManyBySupervisor(
    supervisorId: UniqueEntityID,
    tenantId: string,
    includeDeleted = false,
  ): Promise<Employee[]> {
    const employeesData = await prisma.employee.findMany({
      where: {
        supervisorId: supervisorId.toString(),
        tenantId,
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: { fullName: 'asc' },
      include: {
        user: true,
        department: true,
        position: true,
        supervisor: true,
      },
    });

    return employeesData.map((employeeData) => {
      decryptEmployeeData(employeeData as unknown as Record<string, unknown>);
      return Employee.create(
        mapEmployeePrismaToDomain(employeeData),
        new UniqueEntityID(employeeData.id),
      );
    });
  }

  async findManyActive(
    tenantId: string,
    includeDeleted = false,
  ): Promise<Employee[]> {
    const employeesData = await prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        tenantId,
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: { fullName: 'asc' },
      include: {
        user: true,
        department: true,
        position: true,
        supervisor: true,
      },
    });

    return employeesData.map((employeeData) => {
      decryptEmployeeData(employeeData as unknown as Record<string, unknown>);
      return Employee.create(
        mapEmployeePrismaToDomain(employeeData),
        new UniqueEntityID(employeeData.id),
      );
    });
  }

  async findManyTerminated(
    tenantId: string,
    includeDeleted = false,
  ): Promise<Employee[]> {
    const employeesData = await prisma.employee.findMany({
      where: {
        status: 'TERMINATED',
        tenantId,
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: { fullName: 'asc' },
      include: {
        user: true,
        department: true,
        position: true,
        supervisor: true,
      },
    });

    return employeesData.map((employeeData) => {
      decryptEmployeeData(employeeData as unknown as Record<string, unknown>);
      return Employee.create(
        mapEmployeePrismaToDomain(employeeData),
        new UniqueEntityID(employeeData.id),
      );
    });
  }

  async findManyByCompany(
    companyId: UniqueEntityID,
    tenantId: string,
    includeDeleted = false,
  ): Promise<Employee[]> {
    const employeesData = await prisma.employee.findMany({
      where: {
        companyId: companyId.toString(),
        tenantId,
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: { fullName: 'asc' },
      include: {
        user: true,
        department: true,
        position: true,
        supervisor: true,
      },
    });

    return employeesData.map((employeeData) => {
      decryptEmployeeData(employeeData as unknown as Record<string, unknown>);
      return Employee.create(
        mapEmployeePrismaToDomain(employeeData),
        new UniqueEntityID(employeeData.id),
      );
    });
  }

  async update(data: UpdateEmployeeSchema): Promise<Employee | null> {
    try {
      const cipher = tryGetCipher();

      // Build the update data object, then encrypt sensitive fields
      const updateData: Record<string, unknown> = {
        registrationNumber: data.registrationNumber,
        userId:
          data.userId !== undefined
            ? data.userId?.toString() || null
            : undefined,
        fullName: data.fullName,
        socialName:
          data.socialName !== undefined ? data.socialName || null : undefined,
        birthDate:
          data.birthDate !== undefined ? data.birthDate || null : undefined,
        gender: data.gender !== undefined ? data.gender || null : undefined,
        pcd: data.pcd,
        maritalStatus:
          data.maritalStatus !== undefined
            ? data.maritalStatus || null
            : undefined,
        nationality:
          data.nationality !== undefined ? data.nationality || null : undefined,
        birthPlace:
          data.birthPlace !== undefined ? data.birthPlace || null : undefined,
        emergencyContactInfo:
          data.emergencyContactInfo !== undefined
            ? data.emergencyContactInfo
              ? JSON.parse(JSON.stringify(data.emergencyContactInfo))
              : null
            : undefined,
        healthConditions:
          data.healthConditions !== undefined
            ? data.healthConditions
              ? JSON.parse(JSON.stringify(data.healthConditions))
              : null
            : undefined,
        cpf: data.cpf?.value,
        rg: data.rg !== undefined ? data.rg || null : undefined,
        rgIssuer:
          data.rgIssuer !== undefined ? data.rgIssuer || null : undefined,
        rgIssueDate:
          data.rgIssueDate !== undefined ? data.rgIssueDate || null : undefined,
        pis: data.pis !== undefined ? data.pis?.value || null : undefined,
        ctpsNumber:
          data.ctpsNumber !== undefined ? data.ctpsNumber || null : undefined,
        ctpsSeries:
          data.ctpsSeries !== undefined ? data.ctpsSeries || null : undefined,
        ctpsState:
          data.ctpsState !== undefined ? data.ctpsState || null : undefined,
        voterTitle:
          data.voterTitle !== undefined ? data.voterTitle || null : undefined,
        militaryDoc:
          data.militaryDoc !== undefined ? data.militaryDoc || null : undefined,
        email: data.email !== undefined ? data.email || null : undefined,
        personalEmail:
          data.personalEmail !== undefined
            ? data.personalEmail || null
            : undefined,
        phone: data.phone !== undefined ? data.phone || null : undefined,
        mobilePhone:
          data.mobilePhone !== undefined ? data.mobilePhone || null : undefined,
        emergencyContact:
          data.emergencyContact !== undefined
            ? data.emergencyContact || null
            : undefined,
        emergencyPhone:
          data.emergencyPhone !== undefined
            ? data.emergencyPhone || null
            : undefined,
        address: data.address !== undefined ? data.address || null : undefined,
        addressNumber:
          data.addressNumber !== undefined
            ? data.addressNumber || null
            : undefined,
        complement:
          data.complement !== undefined ? data.complement || null : undefined,
        neighborhood:
          data.neighborhood !== undefined
            ? data.neighborhood || null
            : undefined,
        city: data.city !== undefined ? data.city || null : undefined,
        state: data.state !== undefined ? data.state || null : undefined,
        zipCode: data.zipCode !== undefined ? data.zipCode || null : undefined,
        country: data.country,
        bankCode:
          data.bankCode !== undefined ? data.bankCode || null : undefined,
        bankName:
          data.bankName !== undefined ? data.bankName || null : undefined,
        bankAgency:
          data.bankAgency !== undefined ? data.bankAgency || null : undefined,
        bankAccount:
          data.bankAccount !== undefined ? data.bankAccount || null : undefined,
        bankAccountType:
          data.bankAccountType !== undefined
            ? data.bankAccountType || null
            : undefined,
        pixKey: data.pixKey !== undefined ? data.pixKey || null : undefined,
        departmentId:
          data.departmentId !== undefined
            ? data.departmentId?.toString() || null
            : undefined,
        positionId:
          data.positionId !== undefined
            ? data.positionId?.toString() || null
            : undefined,
        supervisorId:
          data.supervisorId !== undefined
            ? data.supervisorId?.toString() || null
            : undefined,
        companyId:
          data.companyId !== undefined
            ? data.companyId?.toString() || null
            : undefined,
        hireDate: data.hireDate,
        terminationDate:
          data.terminationDate !== undefined
            ? data.terminationDate || null
            : undefined,
        status: data.status?.value,
        baseSalary: data.baseSalary,
        contractType: data.contractType?.value,
        workRegime: data.workRegime?.value,
        weeklyHours: data.weeklyHours,
        photoUrl:
          data.photoUrl !== undefined ? data.photoUrl || null : undefined,
        metadata:
          data.metadata !== undefined
            ? data.metadata
              ? JSON.parse(JSON.stringify(data.metadata))
              : null
            : undefined,
        pendingIssues:
          data.pendingIssues !== undefined
            ? data.pendingIssues
              ? JSON.parse(JSON.stringify(data.pendingIssues))
              : []
            : undefined,
      };

      // Remove undefined keys so they don't overwrite existing data
      for (const key of Object.keys(updateData)) {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      }

      if (cipher) {
        // Encrypt sensitive fields that are being updated
        const fieldsToEncrypt = encConfig.encryptedFields;
        for (const field of fieldsToEncrypt) {
          if (
            field in updateData &&
            updateData[field] !== null &&
            typeof updateData[field] === 'string'
          ) {
            updateData[field] = cipher.encrypt(updateData[field] as string);
          }
        }

        // Regenerate hashes for fields that are being updated
        const hashSourceValues: Record<string, string | null | undefined> = {};
        if (data.cpf !== undefined) hashSourceValues.cpf = data.cpf?.value;
        if (data.rg !== undefined) hashSourceValues.rg = data.rg;
        if (data.pis !== undefined) hashSourceValues.pis = data.pis?.value;
        if (data.pixKey !== undefined) hashSourceValues.pixKey = data.pixKey;
        if (data.bankAccount !== undefined)
          hashSourceValues.bankAccount = data.bankAccount;

        if (Object.keys(hashSourceValues).length > 0) {
          const hashFieldsToUpdate: Record<string, string> = {};
          for (const [sourceField, hashColumn] of Object.entries(
            encConfig.hashFields,
          )) {
            if (sourceField in hashSourceValues) {
              hashFieldsToUpdate[sourceField] = hashColumn;
            }
          }
          if (Object.keys(hashFieldsToUpdate).length > 0) {
            const hashes = cipher.generateHashes(
              hashSourceValues,
              hashFieldsToUpdate,
            );
            Object.assign(updateData, hashes);
          }
        }
      }

      const updatedEmployeeData = await prisma.employee.update({
        where: {
          id: data.id.toString(),
          ...(data.tenantId && { tenantId: data.tenantId }),
        },
        data: updateData as Parameters<
          typeof prisma.employee.update
        >[0]['data'],
        include: {
          user: true,
          department: true,
          position: true,
          supervisor: true,
        },
      });

      decryptEmployeeData(
        updatedEmployeeData as unknown as Record<string, unknown>,
      );

      const employee = Employee.create(
        mapEmployeePrismaToDomain(updatedEmployeeData),
        new UniqueEntityID(updatedEmployeeData.id),
      );
      return employee;
    } catch {
      return null;
    }
  }

  async save(employee: Employee): Promise<void> {
    const cipher = tryGetCipher();

    const saveData: Record<string, unknown> = {
      registrationNumber: employee.registrationNumber,
      userId: employee.userId?.toString(),
      fullName: employee.fullName,
      socialName: employee.socialName,
      birthDate: employee.birthDate,
      gender: employee.gender,
      maritalStatus: employee.maritalStatus,
      nationality: employee.nationality,
      birthPlace: employee.birthPlace,
      cpf: employee.cpf.value,
      rg: employee.rg,
      rgIssuer: employee.rgIssuer,
      rgIssueDate: employee.rgIssueDate,
      pis: employee.pis?.value,
      ctpsNumber: employee.ctpsNumber,
      ctpsSeries: employee.ctpsSeries,
      ctpsState: employee.ctpsState,
      voterTitle: employee.voterTitle,
      militaryDoc: employee.militaryDoc,
      email: employee.email,
      personalEmail: employee.personalEmail,
      phone: employee.phone,
      mobilePhone: employee.mobilePhone,
      emergencyContact: employee.emergencyContact,
      emergencyPhone: employee.emergencyPhone,
      address: employee.address,
      addressNumber: employee.addressNumber,
      complement: employee.complement,
      neighborhood: employee.neighborhood,
      city: employee.city,
      state: employee.state,
      zipCode: employee.zipCode,
      country: employee.country,
      bankCode: employee.bankCode,
      bankName: employee.bankName,
      bankAgency: employee.bankAgency,
      bankAccount: employee.bankAccount,
      bankAccountType: employee.bankAccountType,
      pixKey: employee.pixKey,
      departmentId: employee.departmentId?.toString(),
      positionId: employee.positionId?.toString(),
      supervisorId: employee.supervisorId?.toString(),
      hireDate: employee.hireDate,
      terminationDate: employee.terminationDate,
      status: employee.status.value,
      baseSalary: employee.baseSalary,
      contractType: employee.contractType.value,
      workRegime: employee.workRegime.value,
      weeklyHours: employee.weeklyHours,
      photoUrl: employee.photoUrl,
      metadata: JSON.parse(JSON.stringify(employee.metadata)),
      shortId: employee.shortId ?? null,
    };

    if (cipher) {
      // Encrypt sensitive fields
      const fieldsToEncrypt = encConfig.encryptedFields;
      for (const field of fieldsToEncrypt) {
        if (
          saveData[field] !== null &&
          saveData[field] !== undefined &&
          typeof saveData[field] === 'string'
        ) {
          saveData[field] = cipher.encrypt(saveData[field] as string);
        }
      }

      // Regenerate all blind index hashes from plaintext values
      const hashes = cipher.generateHashes(
        {
          cpf: employee.cpf.value,
          rg: employee.rg,
          pis: employee.pis?.value,
          pixKey: employee.pixKey,
          bankAccount: employee.bankAccount,
        },
        encConfig.hashFields,
      );
      Object.assign(saveData, hashes);
    }

    await prisma.employee.update({
      where: {
        id: employee.id.toString(),
        tenantId: employee.tenantId.toString(),
      },
      data: saveData as Parameters<typeof prisma.employee.update>[0]['data'],
    });
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.employee.update({
      where: { id: id.toString(), ...(tenantId && { tenantId }) },
      data: { deletedAt: new Date() },
    });
  }

  async anonymize(data: AnonymizeEmployeeSchema): Promise<Employee | null> {
    const employeeId = data.id.toString();
    const tenantId = data.tenantId;
    const placeholder = 'REDACTED';
    const anonymizedCpf = `${ANONYMIZED_CPF_PREFIX}${data.cpfHashedValue}`;

    try {
      const updatedEmployeeData = await prisma.$transaction(async (tx) => {
        const existing = await tx.employee.findFirst({
          where: {
            id: employeeId,
            ...(tenantId && { tenantId }),
          },
          select: { metadata: true },
        });

        if (!existing) return null;

        const previousMetadata =
          (existing.metadata as Record<string, unknown> | null) ?? {};
        const nextMetadata = {
          ...previousMetadata,
          anonymized: true,
          anonymizedAt: data.anonymizedAt.toISOString(),
          anonymizedByUserId: data.anonymizedByUserId,
          anonymizationReason: data.reason ?? 'LGPD Art. 18 VI',
        };

        const anonymizedFields: Prisma.EmployeeUpdateInput = {
          fullName: `${placeholder} ${placeholder}`,
          socialName: null,
          birthDate: null,
          gender: null,
          maritalStatus: null,
          nationality: null,
          birthPlace: null,
          motherName: null,
          emergencyContactInfo: Prisma.DbNull,
          healthConditions: Prisma.DbNull,
          cpf: anonymizedCpf,
          rg: null,
          rgIssuer: null,
          rgIssueDate: null,
          pis: null,
          ctpsNumber: null,
          ctpsSeries: null,
          ctpsState: null,
          voterTitle: null,
          militaryDoc: null,
          email: null,
          personalEmail: null,
          phone: null,
          mobilePhone: null,
          emergencyContact: null,
          emergencyPhone: null,
          address: null,
          addressNumber: null,
          complement: null,
          neighborhood: null,
          city: null,
          state: null,
          zipCode: null,
          bankCode: null,
          bankName: null,
          bankAgency: null,
          bankAccount: null,
          bankAccountType: null,
          pixKey: null,
          photoUrl: null,
          cpfHash: data.cpfBlindIndex ?? null,
          rgHash: null,
          pisHash: null,
          pixKeyHash: null,
          bankAccountHash: null,
          metadata: nextMetadata as Prisma.InputJsonValue,
          deletedAt: data.anonymizedAt,
          updatedAt: data.anonymizedAt,
          user: { disconnect: true },
        };

        await tx.employeeDependant.updateMany({
          where: {
            employeeId,
            ...(tenantId && { tenantId }),
          },
          data: {
            name: placeholder,
            cpf: null,
            cpfHash: null,
          },
        });

        return tx.employee.update({
          where: {
            id: employeeId,
            ...(tenantId && { tenantId }),
          },
          data: anonymizedFields,
          include: {
            user: true,
            department: true,
            position: true,
            supervisor: true,
          },
        });
      });

      if (!updatedEmployeeData) return null;

      // Anonymized records skip decryption (cpf column already holds the hash)
      return Employee.create(
        mapEmployeePrismaToDomain(updatedEmployeeData),
        new UniqueEntityID(updatedEmployeeData.id),
      );
    } catch {
      return null;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 5 — kiosk QR rotation (D-14, D-15)
  // ──────────────────────────────────────────────────────────────────────────

  async findByQrTokenHash(
    hash: string,
    tenantId: string,
  ): Promise<Employee | null> {
    const row = await prisma.employee.findFirst({
      where: {
        tenantId,
        // Defensive cast — the regenerated Prisma client (post 05-01) exposes
        // this column, but the type may still be narrowed in transient tsc
        // states shared across plans. Runtime behaviour is unaffected.
        qrTokenHash: hash,
        deletedAt: null,
      } as unknown as Prisma.EmployeeWhereInput,
      include: {
        user: true,
        department: true,
        position: true,
        supervisor: true,
      },
    });

    if (!row) return null;

    decryptEmployeeData(row as unknown as Record<string, unknown>);

    return Employee.create(
      mapEmployeePrismaToDomain(row),
      new UniqueEntityID(row.id),
    );
  }

  async rotateQrToken(
    employeeId: string,
    tenantId: string,
    hash: string,
  ): Promise<void> {
    const result = await prisma.employee.updateMany({
      where: {
        id: employeeId,
        tenantId,
        deletedAt: null,
      },
      data: {
        qrTokenHash: hash,
        qrTokenSetAt: new Date(),
      } as unknown as Prisma.EmployeeUpdateManyMutationInput,
    });

    if (result.count === 0) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }
  }

  async rotateQrTokensBulk(
    updates: Array<{ employeeId: string; hash: string }>,
    tenantId: string,
  ): Promise<number> {
    if (updates.length === 0) return 0;

    let updated = 0;
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      for (const { employeeId, hash } of updates) {
        const result = await tx.employee.updateMany({
          where: {
            id: employeeId,
            tenantId,
            deletedAt: null,
          },
          data: {
            qrTokenHash: hash,
            qrTokenSetAt: now,
          } as unknown as Prisma.EmployeeUpdateManyMutationInput,
        });
        updated += result.count;
      }
    });

    return updated;
  }

  async findAllIds(tenantId: string): Promise<string[]> {
    const rows = await prisma.employee.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: { not: 'TERMINATED' },
      },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  async findIdsByDepartments(
    departmentIds: string[],
    tenantId: string,
  ): Promise<string[]> {
    if (departmentIds.length === 0) return [];
    const rows = await prisma.employee.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: { not: 'TERMINATED' },
        departmentId: { in: departmentIds },
      },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  async findAllForCrachas(
    tenantId: string,
    filters: FindCrachasFilters,
  ): Promise<CrachasPaginatedResult> {
    const pageSize = Math.min(Math.max(filters.pageSize, 1), 100);
    const page = Math.max(filters.page, 1);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
      status: { not: 'TERMINATED' },
    };

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.rotationStatus === 'never') {
      where.qrTokenSetAt = null;
    } else if (filters.rotationStatus === 'recent') {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      where.qrTokenSetAt = { gte: cutoff };
    } else if (filters.rotationStatus === 'active') {
      where.qrTokenSetAt = { not: null };
    }

    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        {
          registrationNumber: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.employee.findMany({
        where: where as Prisma.EmployeeWhereInput,
        select: {
          id: true,
          fullName: true,
          registrationNumber: true,
          photoUrl: true,
          // qrTokenSetAt comes from the 05-01 migration; Prisma client selects
          // it by name. Defensive cast keeps us resilient across intermediate
          // tsc states.
          // eslint-disable-next-line @typescript-eslint/naming-convention
          qrTokenSetAt: true,
          department: {
            select: {
              name: true,
            },
          },
        } as unknown as Prisma.EmployeeSelect,
        orderBy: { fullName: 'asc' },
        skip,
        take: pageSize,
      }),
      prisma.employee.count({ where: where as Prisma.EmployeeWhereInput }),
    ]);

    const items = (
      rows as Array<{
        id: string;
        fullName: string;
        registrationNumber: string;
        photoUrl: string | null;
        qrTokenSetAt: Date | null;
        department?: { name: string } | null;
      }>
    ).map((row) => ({
      id: row.id,
      fullName: row.fullName,
      registration: row.registrationNumber,
      photoUrl: row.photoUrl ?? null,
      departmentName: row.department?.name ?? null,
      qrTokenSetAt: row.qrTokenSetAt ?? null,
    }));

    return { items, total };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 5 — PIN fallback (D-08, D-10, D-11)
  // ──────────────────────────────────────────────────────────────────────────

  async updatePunchPin(
    employeeId: string,
    tenantId: string,
    hash: string,
    setAt: Date,
  ): Promise<void> {
    const result = await prisma.employee.updateMany({
      where: {
        id: employeeId,
        tenantId,
        deletedAt: null,
      },
      data: {
        punchPinHash: hash,
        punchPinSetAt: setAt,
      } as unknown as Prisma.EmployeeUpdateManyMutationInput,
    });

    if (result.count === 0) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }
  }

  async updatePinLockState(
    employeeId: string,
    tenantId: string,
    state: {
      failedAttempts: number;
      lockedUntil: Date | null;
      lastFailedAt: Date | null;
    },
  ): Promise<void> {
    await prisma.employee.updateMany({
      where: {
        id: employeeId,
        tenantId,
        deletedAt: null,
      },
      data: {
        punchPinFailedAttempts: state.failedAttempts,
        punchPinLockedUntil: state.lockedUntil,
        punchPinLastFailedAt: state.lastFailedAt,
      } as unknown as Prisma.EmployeeUpdateManyMutationInput,
    });
  }

  async clearPinLock(employeeId: string, tenantId: string): Promise<void> {
    await prisma.employee.updateMany({
      where: {
        id: employeeId,
        tenantId,
        deletedAt: null,
      },
      data: {
        punchPinFailedAttempts: 0,
        punchPinLockedUntil: null,
        punchPinLastFailedAt: null,
      } as unknown as Prisma.EmployeeUpdateManyMutationInput,
    });
  }
}
