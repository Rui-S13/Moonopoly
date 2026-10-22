import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type * as Leaflet from 'leaflet';
import { Listing } from '../../models/listing.models';
import { Bounds } from '../../utils/plot-geometry';
import { MoonService } from '../../services/moon';

@Component({
  selector: 'app-moon-map',
  standalone: true,
  templateUrl: './moon-map.html',
  styleUrl: './moon-map.css',
})
export class MoonMap implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer') private mapContainer!: ElementRef<HTMLDivElement>;

  @Input() center: [number, number] = [0, 0];
  @Input() zoom = 1;
  @Input() listings: Listing[] = [];

  @Output() boundsChange = new EventEmitter<Bounds>();
  @Output() listingSelected = new EventEmitter<Listing>();
  @Output() mapClicked = new EventEmitter<void>();

  private map?: Leaflet.Map;
  private leaflet: typeof Leaflet | null = null;
  private markerLayer: Leaflet.LayerGroup | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private moonService: MoonService,
  ) {}

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const mod = await import('leaflet');
    const L = ((mod as any).default ?? mod) as typeof Leaflet;
    this.leaflet = L;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: this.center,
      zoom: Math.max(this.zoom, 2),
      minZoom: 2,
      maxZoom: 8,
      crs: L.CRS.EPSG4326,
      maxBounds: [
        [-90, -180],
        [90, 180],
      ],
      maxBoundsViscosity: 1,
    });

    L.tileLayer(
      'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
      {
        attribution: 'NASA / GSFC / ASU',
        minZoom: 1,
        maxZoom: 8,
        noWrap: true,
      },
    ).addTo(this.map);

    this.markerLayer = L.layerGroup().addTo(this.map);
    this.map.on('moveend', () => this.emitBounds());

    this.updateMarkers(); // listings may have arrived before the map existed
    this.emitBounds();

    this.map.on('click', () => {
      this.mapClicked.emit();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['listings'] && this.markerLayer) {
      this.updateMarkers();
    }
  }

  private updateMarkers(): void {
    if (!this.leaflet || !this.markerLayer) return;
    this.markerLayer.clearLayers();

    for (const listing of this.listings) {
      const marker = this.leaflet.circleMarker(listing.center, {
        radius: 7,
        color: '#242424',
        weight: 2,
        fillColor: '#7161E8',
        fillOpacity: 1,
      });

      marker.on('mouseover', () => {
        marker.setStyle({
          radius: 9,
          weight: 2,
        });
      });

      marker.on('mouseout', () => {
        marker.setStyle({
          radius: 6,
          weight: 2,
        });
      });

      const price = `$${listing.price.toLocaleString('en-US')}`;
      const priceLabel = listing.type === 'rent' ? `${price} / month` : price;

      const terrain = this.moonService.getTerrainInfo(listing.center);

      marker.bindPopup(`
  <div class="listing-popup">
    <strong>${listing.type === 'rent' ? 'For rent' : 'For sale'}</strong>
    <p class="popup-price">${priceLabel}</p>
    <p>${terrain.region}</p>
  </div>
`);

      marker.on('click', () => this.listingSelected.emit(listing));

      marker.on('click', () => this.listingSelected.emit(listing));

      marker.addTo(this.markerLayer);
    }
  }

  private emitBounds(): void {
    if (!this.map) return;
    const b = this.map.getBounds();
    this.boundsChange.emit({
      south: b.getSouth(),
      north: b.getNorth(),
      west: b.getWest(),
      east: b.getEast(),
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
