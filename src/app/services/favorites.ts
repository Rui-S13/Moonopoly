import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly key = 'moonopoly-favorites';
  readonly ids = signal<number[]>(this.load());

  isFavorite(id: number): boolean {
    return this.ids().includes(id);
  };

  toggle(id: number): void {
    this.ids.update((list) =>
      list.includes(id) ? list.filter((i) => i !== id) : [...list, id]
    );
    this.save();
  };

  private load(): number[] {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(this.key) : null;
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  private save(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.key, JSON.stringify(this.ids()));
      }
    } catch {}
  };
}