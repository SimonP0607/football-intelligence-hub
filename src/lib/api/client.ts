/**
 * Decoupled API client.
 *
 * Today every resource resolves against the DEMO adapter in `src/mock`.
 * When the FastAPI service is reachable, set VITE_API_BASE_URL and the
 * http adapter takes over — components never change.
 */

export const API_BASE_URL: string =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "";

export const USING_DEMO_DATA = API_BASE_URL === "";

export type ApiResource =
  "/health" | "/matches" | "/picks" | "/models" | "/performance" | "/data-quality";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function httpGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { accept: "application/json" },
    ...init,
  });
  if (!res.ok) throw new ApiError(`GET ${path} failed`, res.status);
  return (await res.json()) as T;
}

/** Simulates network latency so loading states are exercised in demo mode. */
export function demo<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
