import { prisma } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';

interface CreateTeamOptions {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  avatarUrl?: string | null;
  color?: string | null;
  isActive?: boolean;
  settings?: object;
}

/**
 * Creates a team directly in the database for E2E tests.
 * Auto-adds the creator as OWNER member.
 */
export async function createTeam(
  tenantId: string,
  createdBy: string,
  overrides: CreateTeamOptions = {},
) {
  const id = overrides.id ?? randomUUID();
  const name = overrides.name ?? `Test Team ${Date.now()}`;
  const slug =
    overrides.slug ??
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

  const team = await prisma.team.create({
    data: {
      id,
      tenantId,
      name,
      slug,
      description: overrides.description ?? null,
      avatarUrl: overrides.avatarUrl ?? null,
      color: overrides.color ?? null,
      isActive: overrides.isActive ?? true,
      settings: overrides.settings ?? {},
      createdBy,
    },
  });

  // Auto-add creator as OWNER member
  await prisma.teamMember.create({
    data: {
      tenantId,
      teamId: team.id,
      userId: createdBy,
      role: 'OWNER',
    },
  });

  return team;
}

interface CreateTeamMemberOptions {
  role?: 'OWNER' | 'ADMIN' | 'MEMBER';
}

/**
 * Creates a team member directly in the database for E2E tests.
 */
export async function createTeamMember(
  teamId: string,
  userId: string,
  tenantId: string,
  options: CreateTeamMemberOptions = {},
) {
  return prisma.teamMember.create({
    data: {
      tenantId,
      teamId,
      userId,
      role: options.role ?? 'MEMBER',
    },
  });
}
