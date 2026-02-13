import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import { prisma } from '@/lib/prisma';
import { mapEmployeePrismaToDomain } from '@/mappers/hr/employee/employee-prisma-to-domain';
import type {
  CreateEmployeeSchema,
  EmployeesRepository,
  EmployeeWithRawRelations,
  UpdateEmployeeSchema,
} from '../employees-repository';

export class PrismaEmployeesRepository implements EmployeesRepository {
  async create(data: CreateEmployeeSchema): Promise<Employee> {
    const prismaData = {
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

    const newEmployeeData = await prisma.employee.create({
      data: prismaData,
      include: {
        user: true,
        department: true,
        position: true,
        supervisor: true,
      },
    });

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
    const employeeData = await prisma.employee.findFirst({
      where: {
        cpf: cpf.value,
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
    const employeeData = await prisma.employee.findFirst({
      where: {
        pis: pis.value,
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

    return employeesData.map((employeeData) =>
      Employee.create(
        mapEmployeePrismaToDomain(employeeData),
        new UniqueEntityID(employeeData.id),
      ),
    );
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

    return employeesData.map((employeeData) =>
      Employee.create(
        mapEmployeePrismaToDomain(employeeData),
        new UniqueEntityID(employeeData.id),
      ),
    );
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

    return employeesData.map((employeeData) =>
      Employee.create(
        mapEmployeePrismaToDomain(employeeData),
        new UniqueEntityID(employeeData.id),
      ),
    );
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

    return employeesData.map((employeeData) =>
      Employee.create(
        mapEmployeePrismaToDomain(employeeData),
        new UniqueEntityID(employeeData.id),
      ),
    );
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

    return employeesData.map((employeeData) =>
      Employee.create(
        mapEmployeePrismaToDomain(employeeData),
        new UniqueEntityID(employeeData.id),
      ),
    );
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

    return employeesData.map((employeeData) =>
      Employee.create(
        mapEmployeePrismaToDomain(employeeData),
        new UniqueEntityID(employeeData.id),
      ),
    );
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

    return employeesData.map((employeeData) =>
      Employee.create(
        mapEmployeePrismaToDomain(employeeData),
        new UniqueEntityID(employeeData.id),
      ),
    );
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

    return employeesData.map((employeeData) =>
      Employee.create(
        mapEmployeePrismaToDomain(employeeData),
        new UniqueEntityID(employeeData.id),
      ),
    );
  }

  async update(data: UpdateEmployeeSchema): Promise<Employee | null> {
    try {
      const updatedEmployeeData = await prisma.employee.update({
        where: { id: data.id.toString() },
        data: {
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
            data.nationality !== undefined
              ? data.nationality || null
              : undefined,
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
            data.rgIssueDate !== undefined
              ? data.rgIssueDate || null
              : undefined,
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
            data.militaryDoc !== undefined
              ? data.militaryDoc || null
              : undefined,
          email: data.email !== undefined ? data.email || null : undefined,
          personalEmail:
            data.personalEmail !== undefined
              ? data.personalEmail || null
              : undefined,
          phone: data.phone !== undefined ? data.phone || null : undefined,
          mobilePhone:
            data.mobilePhone !== undefined
              ? data.mobilePhone || null
              : undefined,
          emergencyContact:
            data.emergencyContact !== undefined
              ? data.emergencyContact || null
              : undefined,
          emergencyPhone:
            data.emergencyPhone !== undefined
              ? data.emergencyPhone || null
              : undefined,
          address:
            data.address !== undefined ? data.address || null : undefined,
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
          zipCode:
            data.zipCode !== undefined ? data.zipCode || null : undefined,
          country: data.country,
          bankCode:
            data.bankCode !== undefined ? data.bankCode || null : undefined,
          bankName:
            data.bankName !== undefined ? data.bankName || null : undefined,
          bankAgency:
            data.bankAgency !== undefined ? data.bankAgency || null : undefined,
          bankAccount:
            data.bankAccount !== undefined
              ? data.bankAccount || null
              : undefined,
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
        },
        include: {
          user: true,
          department: true,
          position: true,
          supervisor: true,
        },
      });

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
    await prisma.employee.update({
      where: { id: employee.id.toString() },
      data: {
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
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.employee.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
