export class DocumentProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentProcessingError";
  }
}

export class DocumentAnalysisError extends DocumentProcessingError {
  constructor(
    message: string,
    public details?: any,
  ) {
    super(message);
    this.name = "DocumentAnalysisError";
  }
}

export class ConfigurationError extends DocumentProcessingError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export class ValidationError extends DocumentProcessingError {
  constructor(
    message: string,
    public validationErrors: any[],
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ExtractError extends DocumentProcessingError {
  constructor(message: string) {
    super(message);
    this.name = "ExtractError";
  }
}
