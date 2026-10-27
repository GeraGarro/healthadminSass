import { Injectable } from "@angular/core";

/** Session memory only: never persist patient information in browser storage. */
@Injectable({ providedIn: "root" })
export class TemporaryDrafts {
  private readonly entries = new Map<string, unknown>();

  get<T>(key: string): T | undefined {
    const value = this.entries.get(key);
    return value === undefined ? undefined : structuredClone(value) as T;
  }

  put<T>(key: string, value: T): void {
    this.entries.set(key, structuredClone(value));
  }

  remove(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }
}
