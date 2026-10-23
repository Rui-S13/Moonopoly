/* import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { from, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ListingServiceTest {
  readonly supabase = inject(SupabaseService).supabaseClient;

  getListings() {
    const promise = this.supabase.from('listings').select('*');

    return from(promise).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error(error);
          return [];
        }

        return data ?? [];
      }),
    );
  }
} */