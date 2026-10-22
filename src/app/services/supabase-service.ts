import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Database } from '../../database/supabase';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly supabaseClient = createClient<Database>(
    environment.supabaseUrl,
    environment.supabaseKey,
  );
}
