import { Injectable, signal } from "@angular/core";
import type { SessionDto } from "./api-contracts";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public correlation: string,
  ) {
    super(message);
  }
}
const fallback: Record<number, string> = {
  400: "Revisá los datos ingresados.",
  401: "La sesión venció. Volvé a ingresar.",
  403: "No tenés permiso para esta acción.",
  404: "El recurso ya no está disponible en este contexto.",
  409: "El horario o el estado cambió. Actualizá la agenda y elegí nuevamente.",
  412: "El turno cambió. Actualizá y revisá la nueva versión antes de repetir la acción.",
  428: "Actualizá el turno antes de modificarlo: falta su versión actual.",
  429: "Se alcanzó el límite de solicitudes. Esperá un momento.",
  503: "El servicio no está disponible. Volvé a intentar.",
};
@Injectable({ providedIn: "root" })
export class ApiClient {
  private csrf = "";
  private tokenFlight?: Promise<void>;
  readonly expired = signal(false);
  readonly mfaRequired = signal(false);
  /** One transport for JSON, CSRF and reports; never retry an uncertain mutation automatically. */
  private async exchange<T>(
    path: string,
    init: RequestInit,
    decode: (r: Response) => Promise<T>,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    const mutation = init.method !== undefined && init.method !== "GET";
    try {
      const r = await fetch("/api/v1" + path, {
        ...init,
        credentials: "same-origin",
        signal: controller.signal,
      });
      if (!r.ok) {
        const problem = await r.json().catch(() => ({}));
        if (r.status === 401 && !path.startsWith("/auth/")) {
          this.expired.set(true);
          this.csrf = "";
        }
        if (r.status === 403 && String(problem?.detail).includes("MFA"))
          this.mfaRequired.set(true);
        throw new ApiError(
          r.status,
          typeof problem?.detail === "string" && problem.detail
            ? problem.detail
            : fallback[r.status] || "No pudimos completar la operación.",
          r.headers.get("X-Correlation-ID") || "",
        );
      }
      try {
        return await decode(r);
      } catch {
        throw new ApiError(
          502,
          mutation
            ? "El servidor respondió, pero no pudimos interpretar el resultado. Actualizá el estado antes de repetir la acción."
            : "La respuesta del servidor está incompleta o no es válida. Volvé a cargar la vista.",
          r.headers.get("X-Correlation-ID") || "",
        );
      }
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError(
        0,
        mutation
          ? "Se interrumpió la conexión y no pudimos confirmar el resultado. Revisá el estado antes de repetir la acción."
          : controller.signal.aborted
            ? "El servidor tardó demasiado. Volvé a intentar."
            : "No hay conexión con el servidor. Volvé a intentar.",
        "",
      );
    } finally {
      clearTimeout(timer);
    }
  }
  token(): Promise<void> {
    return (this.tokenFlight ??= this.exchange("/auth/csrf", {}, async (r) => {
      const body = await r.json();
      if (typeof body?.token !== "string" || !body.token)
        throw new Error("CSRF inválido");
      this.csrf = body.token;
    }).finally(() => {
      this.tokenFlight = undefined;
    }));
  }
  async request<T = any>(
    path: string,
    method = "GET",
    body?: unknown,
    key?: string,
    expectedVersion?: number,
  ): Promise<T> {
    if (method !== "GET" && !this.csrf) await this.token();
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (method !== "GET") headers["X-CSRF-TOKEN"] = this.csrf;
    if (key) headers["Idempotency-Key"] = key;
    if (expectedVersion !== undefined) {
      if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1)
        throw new ApiError(428, fallback[428], "");
      headers["If-Match"] = '"' + expectedVersion + '"';
    }
    return this.exchange(
      path,
      {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      async (r) => {
        if (r.status === 204 || r.headers.get("content-length") === "0")
          return undefined as T;
        const text = await r.text();
        return (text ? JSON.parse(text) : undefined) as T;
      },
    );
  }
  async login(email: string, password: string): Promise<SessionDto> {
    await this.token();
    await this.request("/auth/login", "POST", { email, password });
    await this.token();
    this.expired.set(false);
    this.mfaRequired.set(false);
    return this.request<SessionDto>("/auth/me");
  }
  async logout(): Promise<void> {
    try {
      await this.request("/auth/logout", "POST");
    } finally {
      this.csrf = "";
    }
  }
  download(path: string): Promise<Blob> {
    return this.exchange(path, {}, (r) => r.blob());
  }
}
