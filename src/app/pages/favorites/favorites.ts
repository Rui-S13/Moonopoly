import { Component, OnInit } from '@angular/core';
import { Listing } from '../../models/listing.models';
import { ListingService } from '../../services/listing';
import { FavoritesService } from '../../services/favorites';
import { ListingCard } from '../../components/listing-card/listing-card';

@Component({
  imports: [ListingCard],
  selector: 'app-favorites',
  styleUrl: './favorites.css',
  templateUrl: './favorites.html',
})
export class Favorites implements OnInit {
  listings: Listing[] = [];
  loading: boolean = true;
  error: boolean = false;

  favoriteListings: Listing[] = this.listings.filter((l) => this.favorites.ids().includes(l.id));

  constructor(
    private listingService: ListingService,
    public favorites: FavoritesService,
  ) {}

  ngOnInit(): void {
    this.listingService.getListings().subscribe({
      next: (data) => {
        this.listings = data;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  onFavorite(listing: Listing): void {
    this.favorites.toggle(listing.id);
  }
}
