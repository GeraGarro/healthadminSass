import { TestBed } from "@angular/core/testing";
import { ChangeDetectorRef, signal } from "@angular/core";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ApiClient } from "../core/api.client";
import { WorkspaceStore } from "../core/workspace.store";
import { Messages } from "./messages";

let store: WorkspaceStore, messages: Messages;
beforeEach(() => {
  TestBed.configureTestingModule({ providers: [WorkspaceStore,
    { provide: ChangeDetectorRef, useValue: { markForCheck: vi.fn() } },
    { provide: ApiClient, useValue: { expired: signal(false), mfaRequired: signal(false) } },
  ] });
  store = TestBed.inject(WorkspaceStore);
  vi.spyOn(store, "loadMessages").mockResolvedValue();
  messages = TestBed.runInInjectionContext(() => new Messages());
});
afterEach(() => TestBed.resetTestingModule());

it("conserva cada borrador al cambiar de conversación y al volver a la pantalla", async () => {
  await messages.select("first");
  messages.text = "Primer borrador";
  await messages.select("second");
  messages.text = "Segundo borrador";
  const reopened = TestBed.runInInjectionContext(() => new Messages());
  await reopened.select("first");
  expect(reopened.text).toBe("Primer borrador");
  await reopened.select("second");
  expect(reopened.text).toBe("Segundo borrador");
  store.clearSession();
  expect(reopened.text).toBe("");
});
it("solo elimina el borrador enviado después de un envío exitoso", async () => {
  await messages.select("first");
  messages.text = "Conservar si falla";
  const send = vi.spyOn(store, "sendMessage").mockRejectedValueOnce(new Error("Sin conexión"));
  await messages.send();
  expect(messages.text).toBe("Conservar si falla");
  send.mockResolvedValueOnce();
  await messages.send();
  expect(messages.text).toBe("");
});
it("un envío tardío no borra el texto nuevo escrito al volver a la conversación", async () => {
  await messages.select("first");
  messages.text = "Mensaje en envío";
  let finish!: () => void;
  vi.spyOn(store, "sendMessage").mockReturnValue(new Promise<void>((resolve) => finish = resolve));
  const pending = messages.send();
  const reopened = TestBed.runInInjectionContext(() => new Messages());
  await reopened.select("first");
  reopened.text = "Nuevo borrador";
  finish();
  await pending;
  expect(reopened.text).toBe("Nuevo borrador");
});
