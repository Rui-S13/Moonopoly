import { Header } from '../../components/header/header';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Subscription, switchMap } from 'rxjs';
import { Listing } from '../../models/listing.models';
import { ListingService } from '../../services/listing';
import { MoonService } from '../../services/moon';
import { TerrainInfo } from '../../models/listing.models';
import { MoonMap } from '../../components/moon-map/moon-map';
import { Footer } from '../../components/footer/footer';
import { ProfileService, Profile } from '../../services/profile';
import { ImageService } from '../../services/image';

@Component({
  imports: [Header, RouterLink, CurrencyPipe, DatePipe, MoonMap, Footer],
  selector: 'app-listing-detail',
  styleUrl: './listing-detail.css',
  templateUrl: './listing-detail.html',
})
export class ListingDetail implements OnInit, OnDestroy {
  listing = signal<Listing | undefined>(undefined);
  loading = signal(true);
  error = signal(false);
  private subscription?: Subscription;
  owner = signal<Profile | undefined>(undefined);

  imageFailed: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private listingService: ListingService,
    private moon: MoonService,
    private profiles: ProfileService,
    private images: ImageService,
  ) {}

  ngOnInit(): void {
    this.subscription = this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.loading.set(true);
          this.error.set(false);
          return this.listingService.getListing(Number(params.get('id')));
        }),
      )
      .subscribe({
        next: (listing) => {
          this.listing.set(listing);
          this.loading.set(false);
          if (listing) {
            this.profiles.getProfile(listing.ownerId).subscribe({
              next: (profile) => this.owner.set(profile),
              error: () => this.owner.set(undefined),
            });
          }
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  get terrain(): TerrainInfo {
    return this.moon.getTerrainInfo(this.listing()!.center);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
