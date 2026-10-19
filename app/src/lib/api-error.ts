/**
 * Structured API error carrying HTTP status and the backend's numeric-string
 * response_code, so callers can branch on real values instead of parsing
 * message strings.
 *
 * Contract — server is the single source of truth for user-facing error copy:
 *   - `message`    = the clean server message (response_description preferred,
 *                    falls back to message), shown to users verbatim.
 *   - `description` = same clean message, kept for downstream callers that
 *                    read `.description` first (e.g. video-session-errors.util).
 *   - `responseCode` = backend envelope response_code (e.g. "006", "011").
 *   - `httpStatus` = HTTP status code.
 *
 * Sensitive/internal details are never propagated here: the backend's
 * AllExceptionsFilter sanitises unhandled (500) failures to a generic message
 * before they reach the client, so whatever is in `message`/`description` is
 * safe to surface.
 *
 * Important for HTTP 409: the backend's response_code falls through to the
 * literal string "Internal Server error". Branching on httpStatus is the only
 * reliable signal for that case (see docs/video-call-integration.spec.md §6).
 */
export class ApiError extends Error {
  /** HTTP status code of the failed response, when one was received. */
  readonly httpStatus?: number;

  /** Backend envelope response_code (e.g. "00", "006", "011"). */
  readonly responseCode?: string;

  /** Human-readable reason from the envelope's response_description. */
  readonly description?: string;

  constructor(params: {
    message: string;
    httpStatus?: number;
    responseCode?: string;
    description?: string;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.httpStatus = params.httpStatus;
    this.responseCode = params.responseCode;
    this.description = params.description ?? params.message;
  }
}

/** Narrow an unknown thrown value to a structured ApiError. */
export function asApiError(error: unknown): ApiError | null {
  return error instanceof ApiError ? error : null;
}
