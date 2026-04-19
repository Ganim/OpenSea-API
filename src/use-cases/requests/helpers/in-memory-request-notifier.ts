import type {
  DispatchRequestNotificationInput,
  RequestNotifier,
} from './request-notifier';

export class InMemoryRequestNotifier implements RequestNotifier {
  public dispatches: DispatchRequestNotificationInput[] = [];

  async dispatch(input: DispatchRequestNotificationInput): Promise<void> {
    this.dispatches.push(input);
  }
}
