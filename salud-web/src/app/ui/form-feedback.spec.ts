import { TestBed } from "@angular/core/testing";
import { ElementRef } from "@angular/core";
import { afterEach, expect, it, vi } from "vitest";
import { FormFeedback } from "./form-feedback";

afterEach(() => { document.body.replaceChildren(); TestBed.resetTestingModule(); });
it("bloquea el envío inválido, explica el campo y permite continuar al corregirlo", () => {
  const form = document.createElement("form");
  form.innerHTML = '<label>Correo<input type="email" required aria-describedby="hint" /></label><p id="hint">Tu correo de acceso</p>';
  document.body.appendChild(form);
  TestBed.configureTestingModule({ providers: [{ provide: ElementRef, useValue: new ElementRef(form) }] });
  const feedback = TestBed.runInInjectionContext(() => new FormFeedback());
  const send = vi.fn();
  form.addEventListener("submit", send);
  const field = form.querySelector("input")!;
  form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  expect(send).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(field);
  expect(field.getAttribute("aria-invalid")).toBe("true");
  expect(field.getAttribute("aria-describedby")).toContain("hint ");
  expect(form.textContent).toContain("Completá este campo.");
  field.value = "nombre@example.test";
  field.dispatchEvent(new Event("input", { bubbles: true }));
  form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  expect(send).toHaveBeenCalledOnce();
  expect(field.hasAttribute("aria-invalid")).toBe(false);
  expect(field.getAttribute("aria-describedby")).toBe("hint");
  feedback.ngOnDestroy();
});
