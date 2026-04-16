import { ResourceNotFoundError } from './resource-not-found';

export class KudosNotFoundError extends ResourceNotFoundError {
  constructor(message: string = 'Kudos not found') {
    super(message);
    this.name = 'KudosNotFoundError';
  }
}
