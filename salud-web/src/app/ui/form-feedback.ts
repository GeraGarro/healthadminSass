import { Directive, ElementRef, OnDestroy, inject } from "@angular/core";

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
let nextFeedbackId = 0;

/** Native constraints, with inline Spanish feedback and focus on the first error. */
@Directive({ selector: "form", standalone: true })
export class FormFeedback implements OnDestroy {
  private readonly form: HTMLFormElement = inject<ElementRef<HTMLFormElement>>(ElementRef).nativeElement;
  private readonly errors = new Map<Field, HTMLElement>();
  private readonly submit = (event: Event) => {
    const invalid = [...this.form.querySelectorAll<Field>("input,select,textarea")]
      .filter((field) => field.willValidate && !field.validity.valid);
    if (!invalid.length) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    invalid.forEach((field) => this.show(field));
    invalid[0].focus();
  };
  private readonly blur = (event: Event) => {
    if (this.isField(event.target)) this.show(event.target);
  };
  private readonly change = (event: Event) => {
    if (this.isField(event.target) && this.errors.has(event.target))
      this.show(event.target);
  };

  constructor() {
    this.form.addEventListener("submit", this.submit, true);
    this.form.addEventListener("blur", this.blur, true);
    this.form.addEventListener("input", this.change);
    this.form.addEventListener("change", this.change);
  }

  private isField(target: EventTarget | null): target is Field {
    return target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
  }

  private show(field: Field) {
    if (!field.willValidate || field.validity.valid) {
      this.clear(field);
      return;
    }
    let error = this.errors.get(field);
    if (!error) {
      error = document.createElement("small");
      error.id = `field-feedback-${++nextFeedbackId}`;
      error.className = "field-error";
      (field.closest("label") || field.parentElement)?.appendChild(error);
      this.errors.set(field, error);
      const described = field.getAttribute("aria-describedby")?.split(/\s+/).filter(Boolean) || [];
      field.setAttribute("aria-describedby", [...described, error.id].join(" "));
    }
    field.setAttribute("aria-invalid", "true");
    const validity = field.validity;
    error.textContent = validity.valueMissing
      ? field instanceof HTMLSelectElement ? "Elegí una opción." : "Completá este campo."
      : validity.typeMismatch ? "Ingresá un correo electrónico válido."
      : validity.tooShort ? `Usá al menos ${(field as HTMLInputElement).minLength} caracteres.`
      : validity.rangeUnderflow ? `El valor mínimo es ${(field as HTMLInputElement).min}.`
      : validity.rangeOverflow ? `El valor máximo es ${(field as HTMLInputElement).max}.`
      : validity.patternMismatch ? "Revisá el formato indicado para este campo."
      : "Revisá el valor de este campo.";
  }

  private clear(field: Field) {
    const error = this.errors.get(field);
    if (!error) return;
    const described = (field.getAttribute("aria-describedby") || "").split(/\s+/).filter((id) => id && id !== error.id);
    if (described.length) field.setAttribute("aria-describedby", described.join(" "));
    else field.removeAttribute("aria-describedby");
    field.removeAttribute("aria-invalid");
    error.remove();
    this.errors.delete(field);
  }

  ngOnDestroy() {
    this.form.removeEventListener("submit", this.submit, true);
    this.form.removeEventListener("blur", this.blur, true);
    this.form.removeEventListener("input", this.change);
    this.form.removeEventListener("change", this.change);
    [...this.errors.keys()].forEach((field) => this.clear(field));
  }
}
