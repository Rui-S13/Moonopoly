import { Header } from '../../components/header/header';
import { Component, OnInit, computed, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Listing, ListingType } from '../../models/listing.models';
import { priceRangeValidator } from '../../utils/validators';
import { MoonService } from '../../services/moon';
import { ListingService } from '../../services/listing';
import { FavoritesService } from '../../services/favorites';
import { ListingCard } from '../../components/listing-card/listing-card';
import { Footer } from '../../components/footer/footer';

@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CurrencyPipe,
    DecimalPipe,
    Header,
    Footer,
    ListingCard,
  ],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements OnInit {
  regions: string[] = [];

  listings = signal<Listing[]>([]);
  loading = signal(true);
  error = signal(false);

  readonly steps = [
    {
      title: 'Explore the map',
      text: 'Filter by region, price and status, and see every plot on the lunar surface.',
    },
    {
      title: 'Contact the seller',
      text: 'Write to the owner directly from the listing page.',
    },
    {
      title: 'List your own plot',
      text: 'Create an account, mark your plot on the map and publish it in a minute.',
    },
  ];

  activeListings = computed(() => this.listings().filter((l) => l.status !== 'sold'));

  stats = computed(() => {
    const active = this.activeListings();
    const sales = active.filter((l) => l.type === 'sale');
    const regions = new Set(active.map((l) => this.moon.getTerrainInfo(l.center).region));

    return {
      count: active.length,
      regions: regions.size,
      totalArea: active.reduce((sum, l) => sum + l.widthKm * l.heightKm, 0),
      averageSalePrice: sales.length
        ? sales.reduce((sum, l) => sum + l.price, 0) / sales.length
        : null,
    };
  });

  featured = computed(() =>
    [...this.activeListings()]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 3),
  );

  regionTiles = computed(() => {
    const counts = new Map<string, number>();
    for (const l of this.activeListings()) {
      const region = this.moon.getTerrainInfo(l.center).region;
      counts.set(region, (counts.get(region) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 6);
  });

  constructor(
    private router: Router,
    private moon: MoonService,
    private listingService: ListingService,
    public favorites: FavoritesService,
  ) {
    this.regions = this.moon.getRegionNames();
  }

  search = new FormGroup(
    {
      type: new FormControl<ListingType | null>(null),
      minPrice: new FormControl<number | null>(null, Validators.min(1)),
      maxPrice: new FormControl<number | null>(null, Validators.min(1)),
      region: new FormControl<string>('', { nonNullable: true }),
    },
    {
      validators: priceRangeValidator,
    },
  );

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

  searchListings(): void {
    if (this.search.invalid) {
      return;
    }

    const s = this.search.getRawValue();

    this.router.navigate(['/listings'], {
      queryParams: {
        region: s.region || null,
        type: s.type || null,
        minPrice: s.minPrice,
        maxPrice: s.maxPrice,
      },
    });
  }

  onFavorite(listing: Listing): void {
    this.favorites.toggle(listing.id);
  }
}