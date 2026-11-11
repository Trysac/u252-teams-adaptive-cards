/**
 * Error type thrown by all public APIs.
 */
export type TeamsCardErrorCode =
  | "invalid_url"
  | "invalid_body"
  | "invalid_facts"
  | "too_many_actions"
  | "message_too_large"
  | "delivery_failed"
  | "rate_limited"
  | "http_error"
  | "transport_failed";

export class TeamsCardError extends Error {
  readonly code: TeamsCardErrorCode;
  readonly status?: number;

  constructor(code: TeamsCardErrorCode, message?: string, options?: { status?: number }) {
    super(message ?? code);
    this.name = "TeamsCardError";
    this.code = code;
    if (options?.status !== undefined) {
      this.status = options.status;
    }
    Object.setPrototypeOf(this, TeamsCardError.prototype);
  }
}
