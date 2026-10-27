import type { ApiClient } from "./api.client";
import type { PageDto } from "./api-contracts";

/** Never silently display a truncated or shifting server projection as a complete list. */
export async function readAllPages<T extends { id: string }>(
  api: ApiClient,
  path: string,
  limit = 250,
): Promise<T[]> {
  const items: T[] = [],
    ids = new Set<string>();
  let total: number | undefined;
  for (let offset = 0; ; offset += limit) {
    const page = await api.request<PageDto<T>>(
      `${path}${path.includes("?") ? "&" : "?"}offset=${offset}&limit=${limit}`,
    );
    if (
      !page ||
      !Array.isArray(page.items) ||
      !Number.isSafeInteger(page.total) ||
      page.total < 0 ||
      page.total > 50000 ||
      page.offset !== offset ||
      page.limit !== limit ||
      page.items.length > limit
    )
      throw new Error(
        "El servidor devolvió una página inválida o demasiado grande. Acotá la consulta.",
      );
    total ??= page.total;
    if (total !== page.total)
      throw new Error(
        "El listado cambió durante la carga. Actualizá para consultar una versión completa.",
      );
    for (const item of page.items) {
      if (!item.id || ids.has(item.id))
        throw new Error(
          "La paginación cambió durante la carga. Actualizá el listado.",
        );
      ids.add(item.id);
      items.push(item);
    }
    if (items.length === total) return items;
    if (page.items.length < limit || items.length > total)
      throw new Error(
        "El listado llegó incompleto. Actualizá antes de continuar.",
      );
  }
}

/** Bound parallel agenda reads so a large delegation does not exhaust the connection pool. */
export async function settleLimited<T>(
  jobs: (() => Promise<T>)[],
  concurrency = 6,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(jobs.length);
  let cursor = 0;
  await Promise.all(
    Array.from(
      { length: Math.min(Math.max(1, concurrency), jobs.length) },
      async () => {
        for (;;) {
          const i = cursor++;
          if (i >= jobs.length) return;
          try {
            results[i] = { status: "fulfilled", value: await jobs[i]() };
          } catch (reason) {
            results[i] = { status: "rejected", reason };
          }
        }
      },
    ),
  );
  return results;
}

/** Chat authorization is checked before returning each item; an empty page can still have a cursor. */
export async function readConversationPages<T extends { id: string }>(
  api: ApiClient,
  path: string,
): Promise<T[]> {
  const items: T[] = [],
    seen = new Set<string>();
  let offset = 0;
  for (let scan = 0; scan < 500; scan++) {
    const page = await api.request<{ items: T[]; nextOffset: number | null }>(
      path + "?offset=" + offset,
    );
    if (
      !Array.isArray(page?.items) ||
      page.items.length > 100 ||
      (page.nextOffset !== null && page.nextOffset !== offset + 100)
    )
      throw new Error(
        "La página de conversaciones no es válida. Actualizá el espacio.",
      );
    for (const item of page.items) {
      if (!item.id || seen.has(item.id))
        throw new Error(
          "El listado de conversaciones cambió. Actualizá el espacio.",
        );
      seen.add(item.id);
      items.push(item);
    }
    if (page.nextOffset === null) return items;
    offset = page.nextOffset;
  }
  throw new Error(
    "El historial de conversaciones es demasiado grande para esta vista.",
  );
}
