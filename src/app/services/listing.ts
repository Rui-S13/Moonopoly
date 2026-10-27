import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from './supabase-service';
import { Listing, ListingStatus, ListingType } from '../models/listing.models';
import { Database } from '../../database/supabase';

type ListingRow = Database['public']['Tables']['listings']['Row'];
type ListingInsert = Database['public']['Tables']['listings']['Insert'];

@Injectable({ providedIn: 'root' })
export class ListingService {
  private readonly supabase = inject(SupabaseService).supabaseClient;

  getListings(): Observable<Listing[]> {
    return from(this.supabase.from('listings').select('*')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row) => this.toListing(row));
      }),
    );
  }

  getListing(id: number): Observable<Listing | undefined> {
    return from(this.supabase.from('listings').select('*').eq('id', id).maybeSingle()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ? this.toListing(data) : undefined;
      }),
    );
  }

  addListing(data: Omit<Listing, 'id' | 'ownerId'>): Observable<Listing> {
    return from(this.supabase.from('listings').insert(this.toRow(data)).select().single()).pipe(
      map(({ data: row, error }) => {
        if (error) throw error;
        return this.toListing(row);
      }),
    );
  }

  private toListing(row: ListingRow): Listing {
    return {
      id: row.id,
      description: row.description ?? '',
      type: row.type as ListingType,
      price: row.price,
      status: row.status as ListingStatus,
      center: [row.latitude, row.longitude],
      widthKm: row.width_km,
      heightKm: row.height_km,
      publishedAt: row.published_at,
      imageUrl: row.image_url ?? undefined,
      ownerId: row.owner_id ?? '',
    };
  }

  private toRow(data: Omit<Listing, 'id' | 'ownerId'>): ListingInsert {
    return {
      description: data.description,
      type: data.type,
      price: data.price,
      status: data.status,
      latitude: data.center[0],
      longitude: data.center[1],
      width_km: data.widthKm,
      height_km: data.heightKm,
      published_at: data.publishedAt,
      image_url: data.imageUrl ?? null,
    };
  }

  getMyListings(ownerId: string): Observable<Listing[]> {
    return from(this.supabase.from('listings').select('*').eq('owner_id', ownerId)).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row) => this.toListing(row));
      }),
    );
  }

  updateListing(id: number, data: Omit<Listing, 'id' | 'ownerId'>): Observable<Listing> {
    return from(
      this.supabase.from('listings').update(this.toRow(data)).eq('id', id).select().single(),
    ).pipe(
      map(({ data: row, error }) => {
        if (error) throw error;
        return this.toListing(row);
      }),
    );
  }

  updateStatus(id: number, status: ListingStatus): Observable<Listing> {
    return from(
      this.supabase.from('listings').update({ status }).eq('id', id).select().single(),
    ).pipe(
      map(({ data: row, error }) => {
        if (error) throw error;
        return this.toListing(row);
      }),
    );
  }

  deleteListing(id: number): Observable<void> {
    return from(this.supabase.from('listings').delete().eq('id', id).select()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data?.length) throw new Error('Listing not found or not yours');
      }),
    );
  }
}
