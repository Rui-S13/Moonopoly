import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Listing } from '../../models/listing.models';

@Component({
  selector: 'app-listing-card',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './listing-card.html',
  styleUrl: './listing-card.css',
})
export class ListingCard {
  @Input({ required: true }) listing!: Listing;
  @Input() isFavorite = false;
  @Output() favorite = new EventEmitter<Listing>();

  onFavorite(): void {
    this.favorite.emit(this.listing);
  }
}