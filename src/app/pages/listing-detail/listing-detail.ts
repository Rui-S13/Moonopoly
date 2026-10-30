import { Header } from '../../components/header/header';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
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
import { NavigationHistory } from '../../services/navigation-history';
import { AuthService } from '../../services/auth';

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
  isOwner = signal(false);

  imageFailed: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private listingService: ListingService,
    private moon: MoonService,
    private profiles: ProfileService,
    private images: ImageService,
    private router: Router,
    private navHistory: NavigationHistory,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.subscription = this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.loading.set(true);
          this.error.set(false);
          this.isOwner.set(false);

          return this.listingService.getListing(Number(params.get('id')));
        }),
      )
      .subscribe({
        next: async (listing) => {
          this.listing.set(listing);
          this.loading.set(false);

          if (listing) {
            const currentUserId = await this.auth.getUserId();

            this.isOwner.set(currentUserId === listing.ownerId);

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

  goBack(event: Event): void {
    event.preventDefault();
    this.navHistory.goBack('/listings');
  }

  onDelete(listing: Listing): void {
    if (!confirm('Delete this listing? This cannot be undone.')) return;

    this.listingService.deleteListing(listing.id).subscribe({
      next: () => {
        console.log('Delete request completed for listing:', listing.id);
        void this.images.remove(listing.imageUrl);
        this.navHistory.goBack('/listings');
      },
      error: (error) => {
        console.error('Delete failed:', error);
        alert('Could not delete the listing. Check the console for details.');
      },
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
