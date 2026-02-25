import type { FastifyInstance } from 'fastify';

import { createTeamController } from './v1-create-team.controller';
import { getTeamController } from './v1-get-team.controller';
import { listTeamsController } from './v1-list-teams.controller';
import { updateTeamController } from './v1-update-team.controller';
import { deleteTeamController } from './v1-delete-team.controller';
import { addTeamMembersController } from './v1-add-team-members.controller';
import { removeTeamMemberController } from './v1-remove-team-member.controller';
import { changeTeamMemberRoleController } from './v1-change-member-role.controller';
import { listTeamMembersController } from './v1-list-team-members.controller';
import { listMyTeamsController } from './v1-list-my-teams.controller';
import { bulkAddTeamMembersController } from './v1-bulk-add-members.controller';
import { transferTeamOwnershipController } from './v1-transfer-ownership.controller';

export async function teamsRoutes(app: FastifyInstance) {
  // Register /my before /:teamId routes to avoid path collision
  app.register(listMyTeamsController);
  app.register(createTeamController);
  app.register(getTeamController);
  app.register(listTeamsController);
  app.register(updateTeamController);
  app.register(deleteTeamController);
  app.register(addTeamMembersController);
  app.register(removeTeamMemberController);
  app.register(changeTeamMemberRoleController);
  app.register(listTeamMembersController);
  app.register(bulkAddTeamMembersController);
  app.register(transferTeamOwnershipController);
}
