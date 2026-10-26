import type { ZodError } from 'zod';

/**
 * Error bodies follow the v1 (Django REST Framework) style the mobile app already parses:
 *   field errors  -> { email: ["..."], message: "Email: ..." }
 *   general error -> { non_field_errors: ["..."], message: "..." }
 *   auth errors   -> { detail: "..." }
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public body: Record<string, unknown>,
  ) {
    super(typeof body.message === 'string' ? body.message : `HTTP ${statusCode}`);
  }
}

export function badRequest(message: string): ApiError {
  return new ApiError(400, { non_field_errors: [message], message });
}

export function fieldError(field: string, message: string): ApiError {
  return new ApiError(400, { [field]: [message], message });
}

export function notFound(message = 'Not found'): ApiError {
  return new ApiError(404, { error: message, message });
}

export function unauthorized(detail = 'Authentication credentials were not provided.'): ApiError {
  return new ApiError(401, { detail, message: detail });
}

export function fromZod(err: ZodError): ApiError {
  const body: Record<string, unknown> = {};
  let first = '';
  for (const issue of err.issues) {
    const field = issue.path.length ? String(issue.path[0]) : 'non_field_errors';
    const list = (body[field] as string[] | undefined) ?? [];
    list.push(issue.message);
    body[field] = list;
    if (!first) first = field === 'non_field_errors' ? issue.message : `${field}: ${issue.message}`;
  }
  body.message = first || 'Invalid request';
  return new ApiError(400, body);
}
