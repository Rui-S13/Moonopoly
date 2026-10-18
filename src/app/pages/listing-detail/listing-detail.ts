import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Subscription, switchMap } from 'rxjs';
import { Listing } from '../../models/listing.models';
import { ListingService } from '../../services/listing';

@Component({
  imports: [RouterLink, CurrencyPipe, DatePipe],
  selector: 'app-listing-detail',
  styleUrl: './listing-detail.css',
  templateUrl: './listing-detail.html',
})
export class ListingDetail implements OnInit, OnDestroy {
  listing = signal<Listing | undefined>(undefined);
  loading = signal(true);
  error = signal(false);
  private subscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private listingService: ListingService
  ) {}

  ngOnInit(): void {
    this.subscription = this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.loading.set(true);
          this.error.set(false);
          return this.listingService.getListing(Number(params.get('id')));
        })
      )
      .subscribe({
        next: (listing) => {
          this.listing.set(listing);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}