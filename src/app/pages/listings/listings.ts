import { Component, OnInit, signal } from '@angular/core';
import { Listing } from '../../models/listing.models';
import { ListingType } from '../../models/listing.models';
import { ListingService } from '../../services/listing';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ListingCard } from '../../components/listing-card/listing-card';
import { FavoritesService } from '../../services/favorites';
import { priceRangeValidator } from '../../utils/validators';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

@Component({
  imports: [CurrencyPipe, DatePipe, ListingCard, ReactiveFormsModule],
  selector: 'app-listings',
  styleUrl: './listings.css',
  templateUrl: './listings.html',
})
export class Listings implements OnInit {
  listings: Listing[] = [];
  loading: boolean = true;
  error: boolean = false;

  filteredListings: Listing[] = [];

  constructor(
    private listingService: ListingService,
    public favorites: FavoritesService,
  ) {}

  ngOnInit(): void {
    this.listingService.getListings().subscribe({
      next: (data) => {
        this.listings = data;
        this.loading = false;
        this.filteredListings = data;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  search = new FormGroup(
    {
      title: new FormControl('', { nonNullable: true }),
      type: new FormControl<ListingType | null>(null),
      minPrice: new FormControl<number | null>(null, Validators.min(1)),
      maxPrice: new FormControl<number | null>(null, Validators.min(1)),
    },
    {
      validators: priceRangeValidator,
    },
  );

  onInputSearch() {
    const s = this.search.getRawValue();

    this.filteredListings = this.listings.filter((l) => {
      if (s.title.trim() !== '' && !l.title.toLowerCase().includes(s.title.trim().toLowerCase())) {
        return false;
      }

      if (s.type !== null && l.type !== s.type) {
        return false;
      }

      if (s.minPrice !== null && l.price < s.minPrice) {
        return false;
      }

      if (s.maxPrice !== null && l.price > s.maxPrice) {
        return false;
      }

      return true;
    });
  }

  onFavorite(listing: Listing): void {
    console.log('Favorite clicked:', listing.title);
    this.favorites.toggle(listing.id);
  }
}
