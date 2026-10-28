import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Listing } from '../../models/listing.models';
import { MoonService } from '../../services/moon';
import { TerrainInfo } from '../../models/listing.models';
import { ImageService } from '../../services/image';

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

  @Input() highlighted = false;
  @Output() highlight = new EventEmitter<boolean>();
  @Output() selected = new EventEmitter<void>();

  imageFailed: boolean = false;

  constructor(
    private moon: MoonService,
    private images: ImageService,
  ) {}

  onPointer(event: PointerEvent, inside: boolean): void {
    if (event.pointerType === 'mouse') {
      this.highlight.emit(inside);
    }
  }

  onFavorite(): void {
    this.favorite.emit(this.listing);
  }

  get terrain(): TerrainInfo {
    return this.moon.getTerrainInfo(this.listing.center);
  }
}
