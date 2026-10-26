import { Header } from '../../components/header/header';
import { Component, OnInit, signal } from '@angular/core';
import { Listing } from '../../models/listing.models';
import { ListingType } from '../../models/listing.models';
import { ListingService } from '../../services/listing';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ListingCard } from '../../components/listing-card/listing-card';
import { FavoritesService } from '../../services/favorites';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { MoonService } from '../../services/moon';
import { priceRangeValidator } from '../../utils/validators';
import { ActivatedRoute } from '@angular/router';
import { MoonMap } from '../../components/moon-map/moon-map';
import { Bounds } from '../../utils/plot-geometry';
import { SortOption } from '../../utils/sort-option';

@Component({
  imports: [Header, MoonMap, CurrencyPipe, DatePipe, ListingCard, ReactiveFormsModule, FormsModule],
  selector: 'app-listings',
  styleUrl: './listings.css',
  templateUrl: './listings.html',
})
export class Listings implements OnInit {
  listings = signal<Listing[]>([]);
  loading = signal(true);
  error = signal(false);

  filteredListings: Listing[] = [];
  regions: string[] = [];

  visibleListings = signal<Listing[]>([]);
  private bounds: Bounds | null = null;

  selectedListingId: number | null = null;

  readonly sortOptions = SortOption;
  sortBy: SortOption = SortOption.Newest;

  search = new FormGroup(
    {
      type: new FormControl<ListingType | null>(null),
      minPrice: new FormControl<number | null>(null, Validators.min(1)),
      maxPrice: new FormControl<number | null>(null, Validators.min(1)),
      region: new FormControl<string>('', { nonNullable: true }),
      favoritesOnly: new FormControl<boolean>(false),
    },
    {
      validators: priceRangeValidator,
    },
  );

  constructor(
    private listingService: ListingService,
    public favorites: FavoritesService,
    private moon: MoonService,
    private route: ActivatedRoute,
  ) {
    this.regions = this.moon.getRegionNames();
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const minPrice = params.get('minPrice');
      const maxPrice = params.get('maxPrice');

      this.search.patchValue(
        {
          region: params.get('region') ?? '',
          type: (params.get('type') as ListingType | null) ?? null,
          minPrice: minPrice !== null ? Number(minPrice) : null,
          maxPrice: maxPrice !== null ? Number(maxPrice) : null,
        },
        { emitEvent: false },
      );

      this.applyFilters();
    });

    this.listingService.getListings().subscribe({
      next: (data) => {
        this.listings.set(data);
        this.loading.set(false);
        this.applyFilters();
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });

    this.search.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  applyFilters() {
    if (this.search.invalid) {
      return;
    }

    const s = this.search.getRawValue();

    this.filteredListings = this.listings().filter((l) => {
      if (s.type !== null && l.type !== s.type) {
        return false;
      }

      if (s.minPrice !== null && l.price < s.minPrice) {
        return false;
      }

      if (s.maxPrice !== null && l.price > s.maxPrice) {
        return false;
      }

      const region = this.moon.getTerrainInfo(l.center).region;
      if (s.region !== '' && s.region !== region) {
        return false;
      }

      if(s.favoritesOnly && !this.favorites.isFavorite(l.id)) {
        return false;
      };

      return true;
    });

    this.updateVisible();
  }

  clearFilters(): void {
    this.search.reset({
      type: null,
      minPrice: null,
      maxPrice: null,
      region: '',
      favoritesOnly: false,
    });
  }

  onBoundsChange(b: Bounds): void {
    this.bounds = b;
    this.updateVisible();
  }

  private updateVisible(): void {
    const b = this.bounds;
    this.visibleListings.set(
      b
        ? this.filteredListings.filter(
            (l) =>
              l.center[0] >= b.south &&
              l.center[0] <= b.north &&
              l.center[1] >= b.west &&
              l.center[1] <= b.east,
          )
        : this.filteredListings,
    );
  }

  get sortedListings() {
    const listings = [...this.visibleListings()];

    switch (this.sortBy) {
      case SortOption.PriceLow:
        return listings.sort((a, b) => a.price - b.price);

      case SortOption.PriceHigh:
        return listings.sort((a, b) => b.price - a.price);

      case SortOption.Area:
        return listings.sort((a, b) => b.widthKm * b.heightKm - a.widthKm * a.heightKm);

      case SortOption.Newest:
      default:
        return listings.sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
        );
    }
  }

  onListingSelected(listing: Listing): void {
    this.selectedListingId = listing.id;

    setTimeout(() => {
      document.getElementById(`listing-${listing.id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }

  onFavorite(listing: Listing): void {
    console.log('Favorite clicked:', listing.id);
    this.favorites.toggle(listing.id);
    this.applyFilters();
  }
}
