import { Injectable, signal, inject } from '@angular/core';
import { from } from 'rxjs';
import { SupabaseService } from './supabase-service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService).supabaseClient;

  readonly currentUser = signal<{ email: string } | null>(null);

  constructor() {
    this.supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user.email;

      this.currentUser.set(email ? { email } : null);
    });

    this.supabase.auth.getSession().then(({ data, error }) => {
      if (!error) {
        const email = data.session?.user.email;

        this.currentUser.set(email ? { email } : null);
      }
    });
  }

  public signUp(email: string, password: string) {
    return from(
      this.supabase.auth.signUp({ email, password })
    );
  }

  public signIn(email: string, password: string) {
    return from(
      this.supabase.auth.signInWithPassword({ email, password })
    );
  }

  public signOut() {
    return from(this.supabase.auth.signOut());
  }
}