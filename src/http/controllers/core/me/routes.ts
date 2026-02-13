import { app } from '@/app';
import { changeMyEmailController } from './v1-change-my-email.controller';
import { changeMyPasswordController } from './v1-change-my-password.controller';
import { changeMyProfileController } from './v1-change-my-profile.controller';
import { changeMyUsernameController } from './v1-change-my-username.controller';
import { setMyAccessPinController } from './v1-set-my-access-pin.controller';
import { setMyActionPinController } from './v1-set-my-action-pin.controller';
import { verifyMyActionPinController } from './v1-verify-my-action-pin.controller';
import { createMyNotificationPreferenceController } from './v1-create-my-notification-preference.controller';
import { deleteMyNotificationPreferenceController } from './v1-delete-my-notification-preference.controller';
import { deleteMyUserController } from './v1-delete-my-user.controller';
import { getMyEmployeeController } from './v1-get-my-employee.controller';
import { getMyTimeBankController } from './v1-get-my-time-bank.controller';
import { getMyUserController } from './v1-get-my-user.controller';
import { listMyAbsencesController } from './v1-list-my-absences.controller';
import { listMyAuditLogsController } from './v1-list-my-audit-logs.controller';
import { listMyGroupsController } from './v1-list-my-groups.controller';
import { listMyNotificationPreferencesController } from './v1-list-my-notification-preferences.controller';
import { listMyOvertimeController } from './v1-list-my-overtime.controller';
import { listMyPayrollItemsController } from './v1-list-my-payroll-items.controller';
import { listMyPermissionsController } from './v1-list-my-permissions.controller';
import { listMyRequestsController } from './v1-list-my-requests.controller';
import { requestMyOvertimeController } from './v1-request-my-overtime.controller';
import { requestMyVacationController } from './v1-request-my-vacation.controller';
import { updateMyNotificationPreferenceController } from './v1-update-my-notification-preference.controller';

export async function meRoutes() {
  // Profile Routes
  app.register(changeMyEmailController);
  app.register(changeMyPasswordController);
  app.register(changeMyUsernameController);
  app.register(changeMyProfileController);
  app.register(getMyUserController);
  app.register(deleteMyUserController);

  // PIN Routes
  app.register(setMyAccessPinController);
  app.register(setMyActionPinController);
  app.register(verifyMyActionPinController);

  // Permissions & Groups Routes
  app.register(listMyPermissionsController);
  app.register(listMyGroupsController);

  // Audit Routes
  app.register(listMyAuditLogsController);

  // Notification Preferences Routes
  app.register(listMyNotificationPreferencesController);
  app.register(createMyNotificationPreferenceController);
  app.register(updateMyNotificationPreferenceController);
  app.register(deleteMyNotificationPreferenceController);

  // HR Self-Service Routes
  app.register(getMyEmployeeController);
  app.register(getMyTimeBankController);
  app.register(listMyOvertimeController);
  app.register(requestMyOvertimeController);
  app.register(listMyAbsencesController);
  app.register(requestMyVacationController);
  app.register(listMyPayrollItemsController);
  app.register(listMyRequestsController);
}
