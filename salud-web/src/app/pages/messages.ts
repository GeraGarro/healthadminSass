import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
  inject,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FormFeedback } from "../ui/form-feedback";
import { WorkspaceStore } from "../core/workspace.store";
import { TemporaryDrafts } from "../core/temporary-drafts";
import { initials } from "../core/domain";
import { Icon } from "../ui/icon";
import { Empty } from "../ui/shared";
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [FormFeedback, FormsModule, Icon, Empty],
  template: ` <div class="page-heading">
      <div>
        <h1>Mensajes</h1>
        <p>Conversaciones humanas, con participantes y permisos específicos.</p>
      </div>
      <span class="privacy-label"
        ><app-icon name="lock" />Acceso por conversación</span
      >
    </div>
    <div class="messaging-layout panel">
      <aside class="conversation-list">
        <div class="directory-toolbar">
          <div class="input-icon">
            <app-icon name="search" /><input
              aria-label="Buscar conversación"
              placeholder="Buscar conversación…"
              [(ngModel)]="query"
            />
          </div>
        </div>
        @for (c of conversations; track c.id) {
          <button [class.active]="selected === c.id" (click)="select(c.id)">
            <span class="avatar">{{ initials(c.name) }}</span
            ><span
              ><strong>{{ c.name }}</strong
              ><small>{{ hasDraft(c.id) ? 'Borrador sin enviar' : c.preview }}</small></span
            >
            @if (c.unread) {
              <b class="count-badge">{{ c.unread }}</b>
            }
          </button>
        }
        @if (!conversations.length) {
          <p class="quiet-note conversation-empty">
            No hay conversaciones para esta selección.
          </p>
        }
      </aside>
      <section class="chat-area">
        @if (conversation; as c) {
          <header class="chat-header">
            <span class="avatar">{{ initials(c.name) }}</span>
            <div>
              <h2>{{ c.name }}</h2>
              <p>Conversación autorizada</p>
            </div>
            <button
              class="icon-btn"
              aria-label="Actualizar mensajes"
              [disabled]="loading"
              (click)="select(c.id)"
            >
              <app-icon name="refresh" />
            </button>
          </header>
          <div class="chat-notice">
            <app-icon name="calendar" />Los mensajes no cambian turnos. Las
            reprogramaciones se realizan desde la agenda.
          </div>
          <div #messageList class="chat-messages" aria-live="polite">
            @if (c.hasOlder) {
              <button class="btn small" [disabled]="loading" (click)="older()">
                Cargar mensajes anteriores
              </button>
            }
            @if (loading) {
              <p role="status">Cargando mensajes…</p>
            }
            @for (message of c.messages; track message.id) {
              <div class="message" [class.own]="message.own">
                <p>{{ message.text }}</p>
                <small>{{ message.time }}</small>
              </div>
            }
            @if (!c.messages.length && !loading) {
              <p class="quiet-note">
                La conversación no tiene mensajes cargados.
              </p>
            }
          </div>
          @if (error) {
            <div class="alert error" role="alert">{{ error }}</div>
          }
          <form class="message-composer" (ngSubmit)="send()">
            <label class="sr-only" for="message-text">Mensaje</label
            ><textarea
              id="message-text"
              name="message"
              rows="2"
              maxlength="4000"
              [(ngModel)]="text"
              placeholder="Escribí un mensaje…"
              [disabled]="sending"
            ></textarea
            ><button class="btn primary" [disabled]="sending || !text.trim()">
              <app-icon name="send" /><span>{{
                sending ? "Enviando…" : "Enviar"
              }}</span>
            </button>
          </form>
          <p class="composer-hint">{{ text.length }} / 4000 caracteres</p>
        } @else {
          <app-empty
            title="Un espacio para conversar"
            text="Elegí una conversación. El acceso a una agenda no concede acceso al chat."
            icon="chat"
          />
        }
      </section>
    </div>`,
})
export class Messages {
  readonly s = inject(WorkspaceStore);
  private readonly drafts = inject(TemporaryDrafts);
  private readonly cdr = inject(ChangeDetectorRef);
  @ViewChild("messageList") list?: ElementRef;
  query = "";
  selected = "";
  get text() { return this.drafts.get<string>(`message:${this.selected}`) || ""; }
  set text(value: string) {
    if (!this.selected) return;
    if (value) this.drafts.put(`message:${this.selected}`, value);
    else this.drafts.remove(`message:${this.selected}`);
  }
  hasDraft(id: string) { return !!this.drafts.get<string>(`message:${id}`); }
  error = "";
  loading = false;
  sending = false;
  initials = initials;
  private epoch = 0;
  get conversations() {
    return this.s
      .data()
      .conversations.filter((c) =>
        c.name.toLowerCase().includes(this.query.toLowerCase()),
      );
  }
  get conversation() {
    return this.s.data().conversations.find((c) => c.id === this.selected);
  }
  async select(id: string) {
    if (this.sending) return;
    const epoch = ++this.epoch;
    this.selected = id;
    this.error = "";
    this.loading = true;
    try {
      await this.s.loadMessages(id);
      if (epoch !== this.epoch || this.selected !== id) return;
      await this.s.markMessagesRead(id);
      setTimeout(() =>
        this.list?.nativeElement.scrollTo({
          top: this.list.nativeElement.scrollHeight,
        }),
      );
    } catch (e) {
      if (epoch === this.epoch) this.error = (e as Error).message;
    } finally {
      this.cdr.markForCheck();
      if (epoch === this.epoch) this.loading = false;
    }
  }
  async older() {
    if (this.loading || this.sending) return;
    const first = this.conversation?.messages[0];
    if (!first) return;
    this.loading = true;
    this.error = "";
    try {
      await this.s.loadMessages(this.selected, first.id);
      await this.s.markMessagesRead(this.selected);
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.cdr.markForCheck();
      this.loading = false;
    }
  }
  async send() {
    const conversationId = this.selected, outgoing = this.text, context = this.s.contextVersion();
    this.sending = true;
    this.error = "";
    try {
      await this.s.sendMessage(conversationId, outgoing);
      if (context === this.s.contextVersion() && this.drafts.get<string>(`message:${conversationId}`) === outgoing)
        this.drafts.remove(`message:${conversationId}`);
      setTimeout(() =>
        this.list?.nativeElement.scrollTo({
          top: this.list.nativeElement.scrollHeight,
          behavior: "smooth",
        }),
      );
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.cdr.markForCheck();
      this.sending = false;
    }
  }
}
