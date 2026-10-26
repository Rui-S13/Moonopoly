import { Injectable, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth';
import { SupabaseService } from './supabase-service';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly supabase = inject(SupabaseService).supabaseClient;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly ids = signal<number[]>([]);

  constructor() {
    effect(() => {
      if (this.auth.currentUser()) {
        this.load();
      } else {
        this.ids.set([]);
      }
    });
  }

  isFavorite(id: number): boolean {
    return this.ids().includes(id);
  }

  async toggle(listingId: number): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    const wasFavorite = this.isFavorite(listingId);

    this.ids.update((list) =>
      wasFavorite ? list.filter((i) => i !== listingId) : [...list, listingId],
    );

    const { error } = wasFavorite
      ? await this.supabase.from('favorites').delete().eq('listing_id', listingId).eq('user_id', user.id)
      : await this.supabase.from('favorites').insert({ listing_id: listingId });

    if (error) {
      this.ids.update((list) =>
        wasFavorite ? [...list, listingId] : list.filter((i) => i !== listingId),
      );
    }
  }

  private async load(): Promise<void> {
    const { data, error } = await this.supabase.from('favorites').select('listing_id');
    if (!error) {
      this.ids.set((data ?? []).map((row) => row.listing_id));
    }
  }
}