import type { FastifyInstance } from 'fastify';

import { listMyCalendarsController } from './v1-list-my-calendars.controller';
import { getCalendarController } from './v1-get-calendar.controller';
import { createTeamCalendarController } from './v1-create-team-calendar.controller';
import { updateCalendarController } from './v1-update-calendar.controller';
import { deleteCalendarController } from './v1-delete-calendar.controller';
import { updateTeamCalendarPermissionsController } from './v1-update-team-calendar-permissions.controller';

export async function calendarCalendarsRoutes(app: FastifyInstance) {
  app.register(listMyCalendarsController);
  app.register(getCalendarController);
  app.register(createTeamCalendarController);
  app.register(updateCalendarController);
  app.register(deleteCalendarController);
  app.register(updateTeamCalendarPermissionsController);
}
