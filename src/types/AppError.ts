export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, true);  // 400 Bad Request
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(503, message, true);  // 503 Service Unavailable
  }
}

export class ServiceError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(503, message, true);
    this.details = details;
  }
  public details?: Record<string, any>;
} 