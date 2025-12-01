import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateEmployeeUseCase } from './create-employee';

let employeesRepository: InMemoryEmployeesRepository;
let sut: CreateEmployeeUseCase;

describe('Create Employee Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new CreateEmployeeUseCase(employeesRepository);
  });

  it('should create an employee successfully', async () => {
    const result = await sut.execute({
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: '529.982.247-25',
      hireDate: new Date('2024-01-01'),
      baseSalary: 3000,
      contractType: 'CLT',
      workRegime: 'FULL_TIME',
      weeklyHours: 44,
      country: 'Brasil',
    });

    expect(result.employee).toBeDefined();
    expect(result.employee.registrationNumber).toBe('EMP001');
    expect(result.employee.fullName).toBe('João Silva');
    expect(result.employee.cpf.value).toBe('52998224725');
    expect(result.employee.status.value).toBe('ACTIVE');
    expect(result.employee.contractType.value).toBe('CLT');
    expect(result.employee.workRegime.value).toBe('FULL_TIME');
    expect(result.employee.baseSalary).toBe(3000);
    expect(result.employee.weeklyHours).toBe(44);
  });

  it('should not create employee with existing CPF', async () => {
    // Create first employee
    await sut.execute({
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: '529.982.247-25',
      hireDate: new Date('2024-01-01'),
      baseSalary: 3000,
      contractType: 'CLT',
      workRegime: 'FULL_TIME',
      weeklyHours: 44,
      country: 'Brasil',
    });

    // Try to create second employee with same CPF
    await expect(
      sut.execute({
        registrationNumber: 'EMP002',
        fullName: 'Maria Santos',
        cpf: '529.982.247-25', // Same CPF
        hireDate: new Date('2024-01-01'),
        baseSalary: 2500,
        contractType: 'CLT',
        workRegime: 'FULL_TIME',
        weeklyHours: 44,
        country: 'Brasil',
      }),
    ).rejects.toThrow('Employee with this CPF already exists');
  });

  it('should not create employee with existing registration number', async () => {
    // Create first employee
    await sut.execute({
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: '529.982.247-25',
      hireDate: new Date('2024-01-01'),
      baseSalary: 3000,
      contractType: 'CLT',
      workRegime: 'FULL_TIME',
      weeklyHours: 44,
      country: 'Brasil',
    });

    // Try to create second employee with same registration number
    await expect(
      sut.execute({
        registrationNumber: 'EMP001', // Same registration number
        fullName: 'Maria Santos',
        cpf: '123.456.789-09',
        hireDate: new Date('2024-01-01'),
        baseSalary: 2500,
        contractType: 'CLT',
        workRegime: 'FULL_TIME',
        weeklyHours: 44,
        country: 'Brasil',
      }),
    ).rejects.toThrow('Employee with this registration number already exists');
  });

  it('should not create employee with existing PIS', async () => {
    // Create first employee
    await sut.execute({
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: '529.982.247-25',
      pis: '12345678900', // PIS válido
      hireDate: new Date('2024-01-01'),
      baseSalary: 3000,
      contractType: 'CLT',
      workRegime: 'FULL_TIME',
      weeklyHours: 44,
      country: 'Brasil',
    });

    // Try to create second employee with same PIS
    await expect(
      sut.execute({
        registrationNumber: 'EMP002',
        fullName: 'Maria Santos',
        cpf: '123.456.789-09',
        pis: '12345678900', // Same PIS
        hireDate: new Date('2024-01-01'),
        baseSalary: 2500,
        contractType: 'CLT',
        workRegime: 'FULL_TIME',
        weeklyHours: 44,
        country: 'Brasil',
      }),
    ).rejects.toThrow('Employee with this PIS already exists');
  });

  it('should not create employee with user already linked', async () => {
    const userId = 'user-123';

    // Create first employee
    await sut.execute({
      registrationNumber: 'EMP001',
      userId,
      fullName: 'João Silva',
      cpf: '529.982.247-25',
      hireDate: new Date('2024-01-01'),
      baseSalary: 3000,
      contractType: 'CLT',
      workRegime: 'FULL_TIME',
      weeklyHours: 44,
      country: 'Brasil',
    });

    // Try to create second employee with same user
    await expect(
      sut.execute({
        registrationNumber: 'EMP002',
        userId, // Same user ID
        fullName: 'Maria Santos',
        cpf: '123.456.789-09',
        hireDate: new Date('2024-01-01'),
        baseSalary: 2500,
        contractType: 'CLT',
        workRegime: 'FULL_TIME',
        weeklyHours: 44,
        country: 'Brasil',
      }),
    ).rejects.toThrow('User is already linked to another employee');
  });

  it('should create employee with all optional fields', async () => {
    const result = await sut.execute({
      registrationNumber: 'EMP001',
      userId: 'user-123',
      fullName: 'João Silva',
      socialName: 'João Silva Social',
      birthDate: new Date('1990-01-01'),
      gender: 'Masculino',
      maritalStatus: 'Casado',
      nationality: 'Brasileiro',
      birthPlace: 'São Paulo',
      cpf: '529.982.247-25',
      rg: '12.345.678-9',
      rgIssuer: 'SSP/SP',
      rgIssueDate: new Date('2010-01-01'),
      pis: '12345678900', // PIS válido
      ctpsNumber: '123456789',
      ctpsSeries: '1234',
      ctpsState: 'SP',
      voterTitle: '123456789012',
      militaryDoc: '123456789',
      email: 'joao.silva@email.com',
      personalEmail: 'joao.personal@email.com',
      phone: '(11) 99999-9999',
      mobilePhone: '(11) 99999-9999',
      emergencyContact: 'Maria Silva',
      emergencyPhone: '(11) 88888-8888',
      address: 'Rua das Flores',
      addressNumber: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      country: 'Brasil',
      bankCode: '001',
      bankName: 'Banco do Brasil',
      bankAgency: '1234',
      bankAccount: '12345-6',
      bankAccountType: 'Corrente',
      pixKey: 'joao.silva@email.com',
      departmentId: 'dept-123',
      positionId: 'pos-123',
      supervisorId: 'emp-456',
      hireDate: new Date('2024-01-01'),
      baseSalary: 3000,
      contractType: 'CLT',
      workRegime: 'FULL_TIME',
      weeklyHours: 44,
      photoUrl: 'https://example.com/photo.jpg',
      metadata: { notes: 'Funcionário exemplar' },
    });

    expect(result.employee).toBeDefined();
    expect(result.employee.registrationNumber).toBe('EMP001');
    expect(result.employee.userId?.toString()).toBe('user-123');
    expect(result.employee.fullName).toBe('João Silva');
    expect(result.employee.socialName).toBe('João Silva Social');
    expect(result.employee.email).toBe('joao.silva@email.com');
    expect(result.employee.photoUrl).toBe('https://example.com/photo.jpg');
    expect(result.employee.metadata).toEqual({ notes: 'Funcionário exemplar' });
  });

  it('should throw error for invalid contract type', async () => {
    await expect(
      sut.execute({
        registrationNumber: 'EMP001',
        fullName: 'João Silva',
        cpf: '529.982.247-25',
        hireDate: new Date('2024-01-01'),
        baseSalary: 3000,
        contractType: 'INVALID_TYPE',
        workRegime: 'FULL_TIME',
        weeklyHours: 44,
        country: 'Brasil',
      }),
    ).rejects.toThrow('Invalid contract type: INVALID_TYPE');
  });

  it('should throw error for invalid work regime', async () => {
    await expect(
      sut.execute({
        registrationNumber: 'EMP001',
        fullName: 'João Silva',
        cpf: '529.982.247-25',
        hireDate: new Date('2024-01-01'),
        baseSalary: 3000,
        contractType: 'CLT',
        workRegime: 'INVALID_REGIME',
        weeklyHours: 44,
        country: 'Brasil',
      }),
    ).rejects.toThrow('Invalid work regime: INVALID_REGIME');
  });

  it('should create employee with default country when not provided', async () => {
    const result = await sut.execute({
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: '529.982.247-25',
      hireDate: new Date('2024-01-01'),
      baseSalary: 3000,
      contractType: 'CLT',
      workRegime: 'FULL_TIME',
      weeklyHours: 44,
      // country not provided
    });

    expect(result.employee.country).toBe('Brasil');
  });
});
