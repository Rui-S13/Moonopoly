import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import type { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase-service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService).supabaseClient;
  readonly currentUser = signal<User | null>(null);

  constructor() {
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUser.set(session?.user ?? null);
    });
  }

  login(email: string, password: string): Observable<void> {
    return from(this.supabase.auth.signInWithPassword({ email, password })).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  signUp(email: string, password: string): Observable<void> {
    return from(this.supabase.auth.signUp({ email, password })).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  logout(): Observable<void> {
    return from(this.supabase.auth.signOut()).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  async isLoggedIn(): Promise<boolean> {
    const { data } = await this.supabase.auth.getSession();
    return data.session !== null;
  }
}