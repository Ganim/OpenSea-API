import { ResourceNotFoundError } from './resource-not-found';

export class KudosReplyNotFoundError extends ResourceNotFoundError {
  constructor(message: string = 'Kudos reply not found') {
    super(message);
    this.name = 'KudosReplyNotFoundError';
  }
}
