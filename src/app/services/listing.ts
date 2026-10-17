import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Listing } from '../models/listing.models';

@Injectable({ providedIn: 'root' })
export class ListingService {
  private readonly url = 'data/listings.json';

  constructor(private http: HttpClient) {};

  getListings(): Observable<Listing[]> {
    return this.http.get<Listing[]>(this.url);
  };
};