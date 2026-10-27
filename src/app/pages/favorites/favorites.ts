import { Header } from '../../components/header/header';
import { Component, OnInit, computed, signal } from '@angular/core';
import { Listing } from '../../models/listing.models';
import { ListingService } from '../../services/listing';
import { FavoritesService } from '../../services/favorites';
import { ListingCard } from '../../components/listing-card/listing-card';
import { Footer } from '../../components/footer/footer';

@Component({
  imports: [Header, ListingCard, Footer],
  selector: 'app-favorites',
  styleUrl: './favorites.css',
  templateUrl: './favorites.html',
})
export class Favorites implements OnInit {
  listings = signal<Listing[]>([]);
  loading = signal(true);
  error = signal(false);

  favoriteListings = computed(() =>
    this.listings().filter((l) => this.favorites.ids().includes(l.id)),
  );

  constructor(
    private listingService: ListingService,
    public favorites: FavoritesService,
  ) {}

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
  }

  onFavorite(listing: Listing): void {
    this.favorites.toggle(listing.id);
  }
}
