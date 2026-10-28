import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Listing, ListingStatus } from '../../models/listing.models';
import { ListingService } from '../../services/listing';
import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notification';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';
import { ImageService } from '../../services/image';

@Component({
  selector: 'app-my-listings',
  imports: [RouterLink, CurrencyPipe, Header, Footer],
  templateUrl: './my-listings.html',
  styleUrl: './my-listings.css',
})
export class MyListings implements OnInit {
  constructor (
    private listingService: ListingService,
    private auth: AuthService,
    private notifications: NotificationService,
    private images: ImageService
  ) {}

  listings = signal<Listing[]>([]);
  loading = signal(true);
  error = signal(false);

  async ngOnInit(): Promise<void> {
    const userId = await this.auth.getUserId();
    if (!userId) {
      this.loading.set(false);
      return;
    }
    this.listingService.getMyListings(userId).subscribe({
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

  onStatusChange(listing: Listing, event: Event): void {
    const status = (event.target as HTMLSelectElement).value as ListingStatus;
    this.listingService.updateStatus(listing.id, status).subscribe({
      next: (updated) => {
        this.listings.update((list) => list.map((l) => (l.id === updated.id ? updated : l)));
        this.notifications.success('Status updated.');
      },
      error: () => this.notifications.error('Could not update the status.'),
    });
  }

  onDelete(listing: Listing): void {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    this.listingService.deleteListing(listing.id).subscribe({
      next: () => {
        this.listings.update((list) => list.filter((l) => l.id !== listing.id));
        this.notifications.success('Listing deleted.');
        void this.images.remove(listing.imageUrl);
      },
      error: () => this.notifications.error('Could not delete the listing.'),
    });
  }
}
