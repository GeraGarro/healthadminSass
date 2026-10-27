import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClient, ApiError } from "./api.client";
const json = (body: unknown, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
describe("Transporte real de la API", () => {
  let api: ApiClient, fetcher: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    api = new ApiClient();
    fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
  it("envía cookie, CSRF, idempotencia y versión en el comando", async () => {
    fetcher
      .mockResolvedValueOnce(json({ token: "csrf-test" }))
      .mockResolvedValueOnce(json({ id: "turno" }));
    await expect(
      api.request(
        "/entities/e/appointments/t/reschedule",
        "POST",
        { start: "date" },
        "retry-key",
        7,
      ),
    ).resolves.toEqual({ id: "turno" });
    expect(fetcher.mock.calls[1]).toEqual([
      "/api/v1/entities/e/appointments/t/reschedule",
      expect.objectContaining({
        credentials: "same-origin",
        method: "POST",
        body: '{"start":"date"}',
        headers: expect.objectContaining({
          "X-CSRF-TOKEN": "csrf-test",
          "Idempotency-Key": "retry-key",
          "If-Match": '"7"',
        }),
      }),
    ]);
  });
  it("comparte la obtención de CSRF entre escrituras simultáneas", async () => {
    fetcher.mockImplementation((path: string) =>
      Promise.resolve(
        path.endsWith("/csrf")
          ? json({ token: "csrf" })
          : new Response(null, { status: 204 }),
      ),
    );
    await Promise.all([
      api.request("/one", "POST"),
      api.request("/two", "DELETE"),
    ]);
    expect(
      fetcher.mock.calls.filter(([url]) => url.endsWith("/csrf")),
    ).toHaveLength(1);
  });
  it.each([401, 403, 404, 409, 412, 428, 429, 503, 500])(
    "conserva el estado HTTP %i y la correlación",
    async (status) => {
      fetcher.mockResolvedValue(
        json({}, status, { "X-Correlation-ID": "trace-test" }),
      );
      await expect(api.request("/entities/e/workspace")).rejects.toMatchObject({
        status,
        correlation: "trace-test",
      });
      expect(api.expired()).toBe(status === 401);
    },
  );
  it("identifica MFA sin conceder permisos locales", async () => {
    fetcher.mockResolvedValue(json({ detail: "MFA requerido" }, 403));
    await expect(api.download("/entities/e/reports")).rejects.toMatchObject({
      status: 403,
      message: "MFA requerido",
    });
    expect(api.mfaRequired()).toBe(true);
  });
  it("también invalida la sesión al descargar un reporte", async () => {
    fetcher.mockResolvedValue(new Response("no json", { status: 401 }));
    await expect(api.download("/reports")).rejects.toMatchObject({
      status: 401,
    });
    expect(api.expired()).toBe(true);
  });
  it("descarga el documento sin interpretarlo como JSON", async () => {
    fetcher.mockResolvedValue(
      new Response("synthetic-report", {
        headers: { "Content-Type": "text/csv" },
      }),
    );
    expect(await (await api.download("/reports")).text()).toBe(
      "synthetic-report",
    );
  });
  it("no reintenta una escritura de resultado incierto", async () => {
    fetcher
      .mockResolvedValueOnce(json({ token: "csrf" }))
      .mockRejectedValueOnce(new TypeError("offline"));
    await expect(
      api.request("/appointments", "POST", {}, "same-key"),
    ).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining("Revisá el estado"),
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("interrumpe la espera al cumplirse 30 segundos", async () => {
    vi.useFakeTimers();
    fetcher.mockImplementation(
      (_path: string, init: RequestInit) =>
        new Promise((_resolve, reject) =>
          init.signal!.addEventListener("abort", () =>
            reject(new DOMException("abort", "AbortError")),
          ),
        ),
    );
    const pending = expect(api.request("/workspace")).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining("tardó demasiado"),
    });
    await vi.advanceTimersByTimeAsync(30000);
    await pending;
  });
  it("rechaza respuestas incompletas y versiones inválidas sin repetir comandos", async () => {
    fetcher
      .mockResolvedValueOnce(new Response("{"))
      .mockResolvedValueOnce(json({ token: "csrf" }));
    await expect(api.request("/workspace")).rejects.toMatchObject({
      status: 502,
    });
    await expect(
      api.request("/confirm", "POST", undefined, undefined, 0),
    ).rejects.toMatchObject({ status: 428 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("no ejecuta el comando si no se pudo obtener CSRF", async () => {
    fetcher.mockResolvedValue(json({ token: null }));
    await expect(api.request("/cancel", "POST")).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("renueva CSRF después de ingresar y al cerrar sesión", async () => {
    const session = { account: { id: "a" }, entities: [] };
    let token = 0;
    fetcher.mockImplementation((path: string) =>
      Promise.resolve(
        path.endsWith("/csrf")
          ? json({ token: "t" + ++token })
          : path.endsWith("/me")
            ? json(session)
            : new Response(null, { status: 204 }),
      ),
    );
    expect(await api.login("synthetic@example.test", "test-only")).toEqual(
      session,
    );
    expect(token).toBe(2);
    await api.logout();
    await api.request("/command", "POST");
    expect(token).toBe(3);
  });
});
