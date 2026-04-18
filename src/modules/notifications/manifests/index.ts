import type { ModuleNotificationManifest } from '../public/index.js';

import { adminManifest } from './admin.manifest.js';
import { calendarManifest } from './calendar.manifest.js';
import { coreManifest } from './core.manifest.js';
import { emailManifest } from './email.manifest.js';
import { financeManifest } from './finance.manifest.js';
import { hrManifest } from './hr.manifest.js';
import { punchManifest } from './punch.manifest.js';
import { requestsManifest } from './requests.manifest.js';
import { salesManifest } from './sales.manifest.js';
import { stockManifest } from './stock.manifest.js';
import { tasksManifest } from './tasks.manifest.js';

export const manifests: ModuleNotificationManifest[] = [
  coreManifest,
  hrManifest,
  stockManifest,
  salesManifest,
  financeManifest,
  requestsManifest,
  calendarManifest,
  tasksManifest,
  emailManifest,
  adminManifest,
  punchManifest,
];

export {
  adminManifest,
  calendarManifest,
  coreManifest,
  emailManifest,
  financeManifest,
  hrManifest,
  punchManifest,
  requestsManifest,
  salesManifest,
  stockManifest,
  tasksManifest,
};
