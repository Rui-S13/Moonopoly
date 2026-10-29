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

  signUp(email: string, password: string, displayName: string) {
    return from(
      this.supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
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

  async getUserId(): Promise<string | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session?.user.id ?? null;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const email = this.currentUser()?.email;
    if (!email) throw new Error('Not logged in');

    const { error: verifyError } = await this.supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (verifyError) throw new Error('WRONG_PASSWORD');

    const { error } = await this.supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  async changeEmail(newEmail: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
  }

  async deleteAccount(): Promise<void> {
    const { error } = await this.supabase.rpc('delete_my_account');
    if (error) throw error;
    await this.supabase.auth.signOut({ scope: 'local' });
  }
}
