export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends ServiceError {
  constructor(public readonly entity: string) {
    super(`${entity} not found`);
  }
}

export class ForbiddenError extends ServiceError {
  constructor(reason: string) {
    super(`forbidden: ${reason}`);
  }
}

export class ValidationError extends ServiceError {
  constructor(public readonly field: string, message: string) {
    super(`${field}: ${message}`);
  }
}

export class ConflictError extends ServiceError {
  constructor(public readonly field: string, message: string) {
    super(`${field}: ${message}`);
  }
}
