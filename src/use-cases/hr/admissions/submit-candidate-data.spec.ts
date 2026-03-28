import { InMemoryAdmissionsRepository } from '@/repositories/hr/in-memory/in-memory-admissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { SubmitCandidateDataUseCase } from './submit-candidate-data';

let admissionsRepository: InMemoryAdmissionsRepository;
let sut: SubmitCandidateDataUseCase;
const tenantId = 'tenant-123';

describe('Submit Candidate Data Use Case', () => {
  beforeEach(() => {
    admissionsRepository = new InMemoryAdmissionsRepository();
    sut = new SubmitCandidateDataUseCase(admissionsRepository);
  });

  it('should submit candidate data and transition status to IN_PROGRESS', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Maria Santos',
      email: 'maria@example.com',
      expiresAt: new Date(Date.now() + 86400000 * 7),
    });

    const candidatePayload = {
      cpf: '529.982.247-25',
      birthDate: '1990-05-15',
      gender: 'Feminino',
      phone: '11999998888',
      address: 'Rua das Flores, 100',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01001-000',
    };

    const { invite: updatedInvite } = await sut.execute({
      token: invite.token,
      candidateData: candidatePayload,
    });

    expect(updatedInvite.status).toBe('IN_PROGRESS');
    expect(updatedInvite.candidateData).toEqual(candidatePayload);
  });

  it('should throw if token is not found', async () => {
    await expect(
      sut.execute({
        token: 'invalid-token',
        candidateData: { cpf: '123.456.789-09' },
      }),
    ).rejects.toThrow('Admission invite not found');
  });

  it('should throw if invite is cancelled', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'João Silva',
      email: 'joao@example.com',
      expiresAt: new Date(Date.now() + 86400000 * 7),
    });

    await admissionsRepository.update({
      id: invite.id,
      status: 'CANCELLED',
    });

    await expect(
      sut.execute({
        token: invite.token,
        candidateData: { cpf: '123.456.789-09' },
      }),
    ).rejects.toThrow('This admission invite has been cancelled');
  });

  it('should throw if invite is already completed', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Pedro Alves',
      email: 'pedro@example.com',
      expiresAt: new Date(Date.now() + 86400000 * 7),
    });

    await admissionsRepository.update({
      id: invite.id,
      status: 'COMPLETED',
    });

    await expect(
      sut.execute({
        token: invite.token,
        candidateData: { cpf: '123.456.789-09' },
      }),
    ).rejects.toThrow('This admission has already been completed');
  });

  it('should throw if invite has expired', async () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1);

    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Ana Costa',
      email: 'ana@example.com',
      expiresAt: expiredDate,
    });

    await expect(
      sut.execute({
        token: invite.token,
        candidateData: { cpf: '123.456.789-09' },
      }),
    ).rejects.toThrow('This admission invite has expired');
  });

  it('should allow resubmission of candidate data (overwrite)', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Roberto Dias',
      email: 'roberto@example.com',
      expiresAt: new Date(Date.now() + 86400000 * 7),
    });

    await sut.execute({
      token: invite.token,
      candidateData: { cpf: '529.982.247-25', city: 'São Paulo' },
    });

    const { invite: resubmittedInvite } = await sut.execute({
      token: invite.token,
      candidateData: {
        cpf: '529.982.247-25',
        city: 'Curitiba',
        state: 'PR',
      },
    });

    expect(resubmittedInvite.status).toBe('IN_PROGRESS');
    const candidateData = resubmittedInvite.candidateData as Record<
      string,
      unknown
    >;
    expect(candidateData.city).toBe('Curitiba');
    expect(candidateData.state).toBe('PR');
  });

  it('should work when invite has no expiresAt set', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Carlos Lima',
      email: 'carlos@example.com',
    });

    const { invite: updatedInvite } = await sut.execute({
      token: invite.token,
      candidateData: { cpf: '529.982.247-25' },
    });

    expect(updatedInvite.status).toBe('IN_PROGRESS');
    expect(updatedInvite.candidateData).toEqual({ cpf: '529.982.247-25' });
  });

  it('should store complex candidate data with all fields', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Fernanda Souza',
      email: 'fernanda@example.com',
      expiresAt: new Date(Date.now() + 86400000 * 7),
    });

    const fullCandidateData = {
      cpf: '529.982.247-25',
      rg: '12.345.678-9',
      rgIssuer: 'SSP/SP',
      birthDate: '1985-03-20',
      gender: 'Feminino',
      maritalStatus: 'Solteira',
      nationality: 'Brasileira',
      phone: '11999998888',
      mobilePhone: '11988887777',
      personalEmail: 'fernanda.personal@example.com',
      address: 'Av. Paulista, 1000',
      addressNumber: '1000',
      complement: 'Sala 201',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      country: 'Brasil',
      bankCode: '001',
      bankName: 'Banco do Brasil',
      bankAgency: '1234',
      bankAccount: '56789-0',
      bankAccountType: 'CORRENTE',
      pixKey: 'fernanda@example.com',
      pis: '123.45678.90-1',
      ctpsNumber: '1234567',
      ctpsSeries: '001',
      ctpsState: 'SP',
    };

    const { invite: updatedInvite } = await sut.execute({
      token: invite.token,
      candidateData: fullCandidateData,
    });

    expect(updatedInvite.candidateData).toEqual(fullCandidateData);
  });
});
