export class GoneError extends Error {
  constructor(message: string = 'Resource is no longer available') {
    super(message);
    this.name = 'GoneError';
  }
}
