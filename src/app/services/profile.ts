import { Injectable, effect, inject, signal, computed } from '@angular/core';
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

  readonly profileReady = signal(false);
  readonly hasContactEmail = computed(() => !!this.myProfile()?.contactEmail?.trim());

  readonly myProfile = signal<Profile | undefined>(undefined);

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.profileReady.set(false);
        this.getProfile(user.id).subscribe({
          next: (profile) => {
            this.myProfile.set(profile);
            this.profileReady.set(true);
          },
          error: () => {
            this.myProfile.set(undefined);
            this.profileReady.set(true);
          },
        });
      } else {
        this.myProfile.set(undefined);
        this.profileReady.set(false);
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

    if (!contactEmail.trim()) {
      const { count, error: countError } = await this.supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .neq('status', 'sold');
      if (countError) throw countError;
      if ((count ?? 0) > 0) throw new Error('CONTACT_REQUIRED');
    }

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
