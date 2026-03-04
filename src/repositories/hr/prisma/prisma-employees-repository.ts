import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import { prisma, type Prisma } from '@/lib/prisma';
import { mapEmployeePrismaToDomain } from '@/mappers/hr/employee/employee-prisma-to-domain';
import { getFieldCipherService } from '@/services/security/field-cipher-service';
import { ENCRYPTED_FIELD_CONFIG } from '@/services/security/encrypted-field-config';
import type {
  CreateEmployeeSchema,
  EmployeesRepository,
  EmployeeWithRawRelations,
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
  async create(data: CreateEmployeeSchema): Promise<Employee> {
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

    const newEmployeeData = await prisma.employee.create({
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
        where: { id: data.id.toString() },
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
      where: { id: employee.id.toString() },
      data: saveData as Parameters<typeof prisma.employee.update>[0]['data'],
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.employee.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
