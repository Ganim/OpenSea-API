import { BadRequestError } from './bad-request-error';

/**
 * Thrown when `notificationClient.dispatch()` is called with a category
 * that isn't declared in any registered module manifest. Activated by the
 * `NOTIFICATIONS_STRICT_MANIFEST=true` env flag.
 */
export class UndeclaredCategoryError extends BadRequestError {
  constructor(categoryCode: string) {
    super(
      `Notification category "${categoryCode}" is not declared in any module manifest. ` +
        `Add it to the owning module's manifest file and restart the dispatcher.`,
    );
    this.name = 'UndeclaredCategoryError';
  }
}
