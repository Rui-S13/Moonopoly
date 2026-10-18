import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Listing } from '../models/listing.models';

@Injectable({ providedIn: 'root' })
export class ListingService {
  private readonly url = 'data/listings.json';
  private added: Listing[] = [];

  constructor(private http: HttpClient) {};

  getListings(): Observable<Listing[]> {
    return this.http.get<Listing[]>(this.url).pipe(
      map((listings) => [...listings, ...this.added])
    );
  };

  getListing(id: number): Observable<Listing | undefined> {
    return this.getListings().pipe(
      map((listings) => listings.find((l) => l.id === id))
  );};

  addListing(data: Omit<Listing, 'id'>): void {
    this.added.push({ ...data, id: Date.now() });
  };
};