import { describe, it, expect, beforeEach } from 'vitest';
import { CreateTeamUseCase } from './create-team';
import { InMemoryTeamsRepository } from '@/repositories/core/in-memory/in-memory-teams-repository';
import { InMemoryTeamMembersRepository } from '@/repositories/core/in-memory/in-memory-team-members-repository';

let teamsRepository: InMemoryTeamsRepository;
let teamMembersRepository: InMemoryTeamMembersRepository;
let sut: CreateTeamUseCase;

describe('CreateTeamUseCase', () => {
  beforeEach(() => {
    teamsRepository = new InMemoryTeamsRepository();
    teamMembersRepository = new InMemoryTeamMembersRepository();
    sut = new CreateTeamUseCase(teamsRepository, teamMembersRepository);
  });

  it('should create a team', async () => {
    const { team } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      name: 'Engineering',
    });

    expect(team.name).toBe('Engineering');
    expect(team.slug).toBe('engineering');
    expect(team.isActive).toBe(true);
    expect(teamsRepository.items).toHaveLength(1);
  });

  it('should auto-add creator as OWNER', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      name: 'Engineering',
    });

    expect(teamMembersRepository.items).toHaveLength(1);
    expect(teamMembersRepository.items[0].role).toBe('OWNER');
    expect(teamMembersRepository.items[0].userId.toString()).toBe('user-1');
  });

  it('should generate slug from name', async () => {
    const { team } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      name: 'Equipe de Vendas',
    });

    expect(team.slug).toBe('equipe-de-vendas');
  });

  it('should set optional fields', async () => {
    const { team } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      name: 'Design',
      description: 'Design team',
      color: '#FF5733',
      avatarUrl: 'https://example.com/avatar.png',
    });

    expect(team.description).toBe('Design team');
    expect(team.color).toBe('#FF5733');
    expect(team.avatarUrl).toBe('https://example.com/avatar.png');
  });

  it('should reject empty name', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        name: '',
      }),
    ).rejects.toThrow('Team name is required');
  });

  it('should reject name longer than 128 characters', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        name: 'A'.repeat(129),
      }),
    ).rejects.toThrow('Team name must be at most 128 characters');
  });

  it('should reject duplicate slug within same tenant', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      name: 'Engineering',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-2',
        name: 'Engineering',
      }),
    ).rejects.toThrow('A team with this name already exists');
  });

  it('should allow same name in different tenants', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      name: 'Engineering',
    });

    const { team } = await sut.execute({
      tenantId: 'tenant-2',
      userId: 'user-2',
      name: 'Engineering',
    });

    expect(team.name).toBe('Engineering');
    expect(teamsRepository.items).toHaveLength(2);
  });
});
