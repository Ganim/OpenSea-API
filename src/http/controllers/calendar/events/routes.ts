import type { FastifyInstance } from 'fastify';

import { createCalendarEventController } from './v1-create-calendar-event.controller';
import { deleteCalendarEventController } from './v1-delete-calendar-event.controller';
import { exportCalendarEventsController } from './v1-export-calendar-events.controller';
import { getCalendarEventController } from './v1-get-calendar-event.controller';
import { listCalendarEventsController } from './v1-list-calendar-events.controller';
import { updateCalendarEventController } from './v1-update-calendar-event.controller';
import { inviteParticipantsController } from './v1-invite-participants.controller';
import { respondToEventController } from './v1-respond-to-event.controller';
import { removeParticipantController } from './v1-remove-participant.controller';
import { manageRemindersController } from './v1-manage-reminders.controller';
import { processDueRemindersController } from './v1-process-due-reminders.controller';
import { shareEventWithUsersController } from './v1-share-event-with-users.controller';
import { shareEventWithTeamController } from './v1-share-event-with-team.controller';
import { unshareEventController } from './v1-unshare-event.controller';

export async function calendarEventsRoutes(app: FastifyInstance) {
  // Register export before :id routes to avoid path collision
  app.register(exportCalendarEventsController);
  app.register(getCalendarEventController);
  app.register(listCalendarEventsController);
  app.register(createCalendarEventController);
  app.register(updateCalendarEventController);
  app.register(deleteCalendarEventController);
  app.register(inviteParticipantsController);
  app.register(respondToEventController);
  app.register(removeParticipantController);
  app.register(shareEventWithUsersController);
  app.register(shareEventWithTeamController);
  app.register(unshareEventController);
  app.register(manageRemindersController);
  app.register(processDueRemindersController);
}
