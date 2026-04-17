export class NotImplementedError extends Error {
  constructor(message: string = 'Feature not implemented') {
    super(message);
    this.name = 'NotImplementedError';
  }
}
