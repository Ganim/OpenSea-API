import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryTrainingEnrollmentsRepository } from '@/repositories/hr/in-memory/in-memory-training-enrollments-repository';
import { InMemoryTrainingProgramsRepository } from '@/repositories/hr/in-memory/in-memory-training-programs-repository';
import { CompleteEnrollmentUseCase } from '@/use-cases/hr/training-enrollments/complete-enrollment';
import { EnrollEmployeeUseCase } from '@/use-cases/hr/training-enrollments/enroll-employee';
import { CreateTrainingProgramUseCase } from '@/use-cases/hr/training-programs/create-training-program';
import { beforeEach, describe, expect, it } from 'vitest';

let employeesRepository: InMemoryEmployeesRepository;
let trainingProgramsRepository: InMemoryTrainingProgramsRepository;
let trainingEnrollmentsRepository: InMemoryTrainingEnrollmentsRepository;
let createTrainingProgram: CreateTrainingProgramUseCase;
let enrollEmployee: EnrollEmployeeUseCase;
let completeEnrollment: CompleteEnrollmentUseCase;

let testEmployee: Employee;
const tenantId = new UniqueEntityID().toString();

describe('[Integration] Training Enrollment Flow', () => {
  beforeEach(async () => {
    employeesRepository = new InMemoryEmployeesRepository();
    trainingProgramsRepository = new InMemoryTrainingProgramsRepository();
    trainingEnrollmentsRepository = new InMemoryTrainingEnrollmentsRepository();

    createTrainingProgram = new CreateTrainingProgramUseCase(
      trainingProgramsRepository,
    );
    enrollEmployee = new EnrollEmployeeUseCase(
      trainingEnrollmentsRepository,
      trainingProgramsRepository,
    );
    completeEnrollment = new CompleteEnrollmentUseCase(
      trainingEnrollmentsRepository,
    );

    testEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Juliana Martins',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2023-06-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 4000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should create program → enroll employee → complete → verify certificate', async () => {
    // Step 1: Create training program
    const { trainingProgram } = await createTrainingProgram.execute({
      tenantId,
      name: 'NR-35 Trabalho em Altura',
      description: 'Capacitação obrigatória para trabalho em altura',
      category: 'SAFETY',
      format: 'PRESENCIAL',
      durationHours: 8,
      instructor: 'Dr. Paulo Andrade',
      isMandatory: true,
      validityMonths: 24,
    });

    expect(trainingProgram.isActive).toBe(true);
    expect(trainingProgram.isMandatory).toBe(true);

    // Step 2: Enroll employee
    const { enrollment } = await enrollEmployee.execute({
      tenantId,
      trainingProgramId: trainingProgram.id.toString(),
      employeeId: testEmployee.id.toString(),
    });

    expect(enrollment.status).toBe('ENROLLED');

    // Step 3: Complete enrollment with score and certificate
    const { enrollment: completedEnrollment } =
      await completeEnrollment.execute({
        tenantId,
        enrollmentId: enrollment.id.toString(),
        score: 92,
        certificateUrl: 'https://certificates.company.com/nr35/cert-001.pdf',
      });

    expect(completedEnrollment.status).toBe('COMPLETED');
    expect(completedEnrollment.score).toBe(92);
    expect(completedEnrollment.certificateUrl).toBe(
      'https://certificates.company.com/nr35/cert-001.pdf',
    );
    expect(completedEnrollment.completedAt).toBeDefined();
  });

  it('should not enroll employee twice in the same program', async () => {
    const { trainingProgram } = await createTrainingProgram.execute({
      tenantId,
      name: 'CIPA Compliance',
      category: 'COMPLIANCE',
      format: 'ONLINE',
      durationHours: 4,
    });

    await enrollEmployee.execute({
      tenantId,
      trainingProgramId: trainingProgram.id.toString(),
      employeeId: testEmployee.id.toString(),
    });

    await expect(
      enrollEmployee.execute({
        tenantId,
        trainingProgramId: trainingProgram.id.toString(),
        employeeId: testEmployee.id.toString(),
      }),
    ).rejects.toThrow('já está inscrito');
  });

  it('should not enroll in inactive program', async () => {
    const { trainingProgram } = await createTrainingProgram.execute({
      tenantId,
      name: 'Outdated Training',
      category: 'TECHNICAL',
      format: 'ONLINE',
      durationHours: 2,
    });

    // Deactivate the program
    await trainingProgramsRepository.update({
      id: trainingProgram.id,
      isActive: false,
    });

    await expect(
      enrollEmployee.execute({
        tenantId,
        trainingProgramId: trainingProgram.id.toString(),
        employeeId: testEmployee.id.toString(),
      }),
    ).rejects.toThrow('programa de treinamento está inativo');
  });

  it('should respect max participants limit', async () => {
    const { trainingProgram } = await createTrainingProgram.execute({
      tenantId,
      name: 'Workshop Liderança',
      category: 'LEADERSHIP',
      format: 'PRESENCIAL',
      durationHours: 16,
      maxParticipants: 1, // Only 1 spot
    });

    // Enroll first employee
    await enrollEmployee.execute({
      tenantId,
      trainingProgramId: trainingProgram.id.toString(),
      employeeId: testEmployee.id.toString(),
    });

    // Create second employee
    const secondEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Fernando Costa',
      cpf: CPF.create('123.456.789-09'),
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3500,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    // Try to enroll second — should fail
    await expect(
      enrollEmployee.execute({
        tenantId,
        trainingProgramId: trainingProgram.id.toString(),
        employeeId: secondEmployee.id.toString(),
      }),
    ).rejects.toThrow('limite máximo de participantes');
  });

  it('should not complete an already completed enrollment', async () => {
    const { trainingProgram } = await createTrainingProgram.execute({
      tenantId,
      name: 'First Aid Training',
      category: 'SAFETY',
      format: 'PRESENCIAL',
      durationHours: 4,
    });

    const { enrollment } = await enrollEmployee.execute({
      tenantId,
      trainingProgramId: trainingProgram.id.toString(),
      employeeId: testEmployee.id.toString(),
    });

    // Complete once
    await completeEnrollment.execute({
      tenantId,
      enrollmentId: enrollment.id.toString(),
      score: 85,
    });

    // Try to complete again
    await expect(
      completeEnrollment.execute({
        tenantId,
        enrollmentId: enrollment.id.toString(),
        score: 90,
      }),
    ).rejects.toThrow('já foi concluída');
  });

  it('should validate score range (0-100)', async () => {
    const { trainingProgram } = await createTrainingProgram.execute({
      tenantId,
      name: 'Soft Skills Workshop',
      category: 'SOFT_SKILLS',
      format: 'HIBRIDO',
      durationHours: 6,
    });

    const { enrollment } = await enrollEmployee.execute({
      tenantId,
      trainingProgramId: trainingProgram.id.toString(),
      employeeId: testEmployee.id.toString(),
    });

    await expect(
      completeEnrollment.execute({
        tenantId,
        enrollmentId: enrollment.id.toString(),
        score: 105, // Over 100
      }),
    ).rejects.toThrow('nota deve estar entre 0 e 100');
  });
});
