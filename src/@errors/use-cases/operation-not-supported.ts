export class OperationNotSupportedError extends Error {
  constructor(message: string = 'Operation not supported by this provider') {
    super(message);
  }
}
