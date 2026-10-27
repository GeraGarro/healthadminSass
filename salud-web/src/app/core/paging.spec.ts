import { describe, expect, it, vi } from "vitest";
import { readAllPages, readConversationPages, settleLimited } from "./paging";
import type { ApiClient } from "./api.client";
describe("Proyecciones completas y concurrencia acotada", () => {
  it("recupera más de cien registros y conserva los filtros de rango", async () => {
    const rows = Array.from({ length: 603 }, (_, id) => ({ id: String(id) }));
    const request = vi.fn(async (path: string) => {
      const q = new URL(path, "http://test").searchParams,
        offset = Number(q.get("offset")),
        limit = Number(q.get("limit"));
      return {
        items: rows.slice(offset, offset + limit),
        offset,
        limit,
        total: rows.length,
      };
    });
    expect(
      await readAllPages(
        { request } as unknown as ApiClient,
        "/calendar?from=2026-10-01",
      ),
    ).toEqual(rows);
    expect(request).toHaveBeenCalledTimes(3);
    expect(request.mock.calls[2][0]).toContain("from=2026-10-01&offset=500");
  });
  it.each([
    { items: [], offset: 0, limit: 250, total: 1 },
    { items: [{ id: "a" }, { id: "a" }], offset: 0, limit: 250, total: 2 },
    { items: [{}], offset: 0, limit: 250, total: 1 },
    { items: [], offset: 2, limit: 250, total: 0 },
    { items: [], offset: 0, limit: 250, total: 50001 },
    { items: [], offset: 0, limit: 1, total: 0 },
    { items: [], offset: 0, limit: 250, total: -1 },
  ])(
    "rechaza páginas inválidas, incompletas o duplicadas (%#)",
    async (page) => {
      await expect(
        readAllPages(
          { request: vi.fn().mockResolvedValue(page) } as unknown as ApiClient,
          "/list",
        ),
      ).rejects.toBeInstanceOf(Error);
    },
  );
  it("advierte cuando el total cambia entre páginas", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        items: [{ id: "a" }],
        offset: 0,
        limit: 1,
        total: 2,
      })
      .mockResolvedValueOnce({
        items: [{ id: "b" }],
        offset: 1,
        limit: 1,
        total: 3,
      });
    await expect(
      readAllPages({ request } as unknown as ApiClient, "/list", 1),
    ).rejects.toThrow("cambió");
  });
  it("admite un listado vacío", async () => {
    expect(
      await readAllPages(
        {
          request: async () => ({ items: [], offset: 0, limit: 250, total: 0 }),
        } as unknown as ApiClient,
        "/list",
      ),
    ).toEqual([]);
  });
  it("continúa tras una página de chat sin elementos autorizados", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({ items: [], nextOffset: 100 })
      .mockResolvedValueOnce({ items: [{ id: "allowed" }], nextOffset: null });
    expect(
      await readConversationPages({ request } as unknown as ApiClient, "/chat"),
    ).toEqual([{ id: "allowed" }]);
    expect(request.mock.calls[1][0]).toBe("/chat?offset=100");
  });
  it("rechaza cursores de chat que no avanzan y duplicados entre páginas", async () => {
    const request = vi.fn().mockResolvedValue({ items: [], nextOffset: 0 });
    await expect(
      readConversationPages({ request } as unknown as ApiClient, "/chat"),
    ).rejects.toThrow("no es válida");
    request
      .mockReset()
      .mockResolvedValueOnce({ items: [{ id: "x" }], nextOffset: 100 })
      .mockResolvedValueOnce({ items: [{ id: "x" }], nextOffset: null });
    await expect(
      readConversationPages({ request } as unknown as ApiClient, "/chat"),
    ).rejects.toThrow("cambió");
  });
  it("limita peticiones simultáneas y conserva fallos parciales en su posición", async () => {
    let active = 0,
      max = 0;
    const jobs = Array.from({ length: 21 }, (_, i) => async () => {
      active++;
      max = Math.max(active, max);
      await new Promise((r) => setTimeout(r, 1));
      active--;
      if (i === 8) throw new Error("denied");
      return i;
    });
    const result = await settleLimited(jobs, 4);
    expect(max).toBe(4);
    expect(active).toBe(0);
    expect(result[8].status).toBe("rejected");
    expect(result[20]).toEqual({ status: "fulfilled", value: 20 });
    expect(await settleLimited([])).toEqual([]);
  });
});
