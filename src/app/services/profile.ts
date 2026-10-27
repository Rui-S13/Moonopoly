import { Injectable, effect, inject, signal } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from './supabase-service';
import { AuthService } from './auth';

export interface Profile {
  id: string;
  displayName: string;
  contactEmail: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly supabase = inject(SupabaseService).supabaseClient;
  private readonly auth = inject(AuthService);

  readonly myProfile = signal<Profile | undefined>(undefined);

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.getProfile(user.id).subscribe({
          next: (profile) => this.myProfile.set(profile),
          error: () => this.myProfile.set(undefined),
        });
      } else {
        this.myProfile.set(undefined);
      }
    });
  }

  getProfile(id: string): Observable<Profile | undefined> {
    return from(this.supabase.from('profiles').select('*').eq('id', id).maybeSingle()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data
          ? { id: data.id, displayName: data.display_name, contactEmail: data.contact_email }
          : undefined;
      }),
    );
  }

  async updateMyProfile(displayName: string, contactEmail: string): Promise<void> {
    const userId = await this.auth.getUserId();
    if (!userId) throw new Error('Not logged in');

    const { error } = await this.supabase
      .from('profiles')
      .update({ display_name: displayName, contact_email: contactEmail || null })
      .eq('id', userId);
    if (error) throw error;

    this.myProfile.update((p) =>
      p ? { ...p, displayName, contactEmail: contactEmail || null } : p,
    );
  }
}
