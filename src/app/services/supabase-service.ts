import { Service } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Database } from '../../database/supabase';

@Service()
export class SupabaseService {
    readonly supabaseClient = createClient<Database>(environment.supabaseUrl, environment.supabaseKey);
}