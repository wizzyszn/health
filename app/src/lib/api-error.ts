/**
 * Structured API error carrying HTTP status and the backend's numeric-string
 * response_code, so callers can branch on real values instead of parsing
 * message strings.
 *
 * Important: for HTTP 409 the backend's response_code is NOT numeric — it
 * falls through to the literal string "Internal Server error". Branching on
 * httpStatus is therefore the only reliable signal for that case (see
 * docs/video-call-integration.spec.md §6).
 *
 * Message format note: the legacy requestHandler threw errors whose message
 * ended with ", status: <code>". Downstream parsers (e.g.
 * getRawApiErrorMessage in lib/utils.ts) strip that suffix, so this class
 * preserves the same convention for compatibility.
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
    this.description = params.description;
  }
}

/** Narrow an unknown thrown value to a structured ApiError. */
export function asApiError(error: unknown): ApiError | null {
  return error instanceof ApiError ? error : null;
}
