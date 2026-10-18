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
  listing: (Listing | undefined)= undefined;
  loading: boolean = true;
  error: boolean = false;
  private subscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private listingService: ListingService
  ) {}

  ngOnInit(): void {
    this.subscription = this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.loading = true;
          this.error = false;
          return this.listingService.getListing(Number(params.get('id')));
        })
      )
      .subscribe({
        next: (listing) => {
          this.listing = listing;
          this.loading = false;
        },
        error: () => {
          this.error = true;
          this.loading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}