import { Component, OnInit, signal } from '@angular/core';
import { Listing } from '../../models/listing.models';
import { ListingService } from '../../services/listing';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ListingCard } from '../../components/listing-card/listing-card';
import { FavoritesService } from '../../services/favorites';

@Component({
  imports: [CurrencyPipe, DatePipe, ListingCard],
  selector: 'app-listings',
  styleUrl: './listings.css',
  templateUrl: './listings.html',
})
export class Listings implements OnInit {
  listings = signal<Listing[]>([]);
  loading = signal(true);
  error = signal(false);

  constructor(
    private listingService: ListingService,
    public favorites: FavoritesService) {};

  ngOnInit(): void {
    this.listingService.getListings().subscribe({
      next: (data) => {
        this.listings.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  };

  onFavorite(listing: Listing): void {
  console.log('Favorite clicked:', listing.title);
  this.favorites.toggle(listing.id);
};
}