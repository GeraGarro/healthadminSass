import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
const paths: Record<string, string[]> = {
  home: ["M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"],
  grid: ["M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"],
  calendar: [
    "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2",
    "M7 14h2M12 14h2M7 18h2",
  ],
  people: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87",
    "M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  ],
  inbox: ["M4 3h16v18H4zM8 7h8M8 11h8M8 15h5"],
  chat: [
    "M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z",
  ],
  bell: ["M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"],
  catalog: ["M4 3h12a2 2 0 0 1 2 2v16H6a2 2 0 0 1-2-2V3Z", "M4 17h14M8 7h6M8 11h4M21 6v12"],
  chart: ["M3 3v18h18M7 16v-5M12 16V7M17 16v-8"],
  settings: [
    "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8",
    "m9 3-1 3-3 1-2 4 2 2v4l4 2 3-1 3 1 4-2v-4l2-2-2-4-3-1-1-3Z",
  ],
  search: ["M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0"],
  plus: ["M12 5v14M5 12h14"],
  chevron: ["m9 5 7 7-7 7"],
  down: ["m6 9 6 6 6-6"],
  arrow: ["M5 12h14m-6-6 6 6-6 6"],
  close: ["m6 6 12 12M6 18 18 6"],
  check: ["m5 12 4 4L19 6"],
  clock: ["M12 8v5l3 2M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0"],
  filter: ["M4 6h16M7 12h10M10 18h4"],
  more: ["M5 11v2M12 11v2M19 11v2"],
  refresh: [
    "M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-2l2 2M4 17l2 2a7 7 0 0 0 12-2",
  ],
  location: [
    "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0",
    "M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  ],
  download: ["M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"],
  logout: ["M9 3H4v18h5M10 12h11m-4-4 4 4-4 4"],
  shield: ["m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z", "m8 12 3 3 5-6"],
  mail: ["M3 5h18v14H3zM3 5l9 7 9-7"],
  phone: [
    "M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3.1 5.2 2 2 0 0 1 2 3V2h6l1 5-3 2a16 16 0 0 0 9 9l2-3Z",
  ],
  edit: ["m16 3 5 5-12 12-6 1 1-6Z M14 5l5 5"],
  warning: ["m12 3 10 18H2Z", "M12 9v4M12 17h.01"],
  list: ["M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"],
  leaf: ["M20 3C8 2 3 7 5 15c6 7 16 1 15-12Z", "M5 21 15 10"],
  send: ["m22 2-7 20-4-9-9-4Z", "M22 2 11 13"],
  sun: [
    "M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
    "M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0",
  ],
  help: [
    "M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4M12 17h.01M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0",
  ],
  lock: ["M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4"],
  back: ["M19 12H5m6 6-6-6 6-6"],
  menu: ["M4 6h16M4 12h16M4 18h16"],
};
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: "app-icon",
  standalone: true,
  template: `<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    @for (path of lines; track $index) {
      <path [attr.d]="path" />
    }
  </svg>`,
  styles: [
    `
      :host {
        display: inline-flex;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        vertical-align: middle;
      }
      svg {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class Icon {
  @Input() name = "calendar";
  get lines() {
    return paths[this.name] || paths["calendar"];
  }
}
