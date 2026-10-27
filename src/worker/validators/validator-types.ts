import type { ContentfulStatusCode } from "hono/utils/http-status";
export type ValidationResult = { error: string, status: ContentfulStatusCode } | null;