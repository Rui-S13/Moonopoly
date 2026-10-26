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
import { Bounds, plotCorners } from '../../utils/plot-geometry';
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

  @Input() previewMode = false;
  @Input() propertyWidthKm = 0;
  @Input() propertyHeightKm = 0;

  private propertyRectangle?: Leaflet.Polygon;

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

    if (this.previewMode) {
      this.map.dragging.disable();
      this.map.scrollWheelZoom.disable();
      this.map.doubleClickZoom.disable();
      this.map.touchZoom.disable();
      this.map.boxZoom.disable();
      this.map.keyboard.disable();
    }

    this.updatePropertyRectangle();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['listings'] && this.markerLayer) {
      this.updateMarkers();
    }

    if (changes['listings'] && this.markerLayer) {
      this.updateMarkers();
    }

    if (this.map && changes['center']) {
      this.map.setView(this.center, this.map.getZoom());
    }

    if (
      this.map &&
      (changes['center'] || changes['propertyWidthKm'] || changes['propertyHeightKm'])
    ) {
      this.updatePropertyRectangle();
    }
  }

  private updateMarkers(): void {
    if (!this.leaflet || !this.markerLayer) return;
    this.markerLayer.clearLayers();

    for (const listing of this.listings) {
      const markerIcon = this.leaflet.divIcon({
        className: 'property-marker',
        html: `
    <div class="property-marker-icon">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect
          x="5" y="5" width="22" height="22"
          rx="2"
          fill="#c9a86a"
          fill-opacity="0.2"
          stroke="#c9a86a"
          stroke-width="1.5"
        />
        <path
          d="M5 5 L27 27 M27 5 L5 27"
          stroke="#c9a86a"
          stroke-width="0.8"
          stroke-opacity="0.65"
        />
        <circle cx="16" cy="16" r="2.5" fill="#c9a86a" />
      </svg>
    </div>
  `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = this.leaflet.marker(listing.center, {
        icon: markerIcon,
      });

      marker.on('mouseover', () => {
        const markerElement = marker.getElement();

        markerElement?.classList.add('selected-marker');
      });

      marker.on('mouseout', () => {
        const markerElement = marker.getElement();

        markerElement?.classList.remove('selected-marker');
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

      const outline = this.leaflet.polygon(plotCorners(listing), {
        color: '#c9a86a',
        weight: 1,
        fillColor: '#c9a86a',
        fillOpacity: 0.25,
      });
      outline.on('click', () => this.listingSelected.emit(listing));
      outline.addTo(this.markerLayer);
    }
  }

  private updatePropertyRectangle(): void {
    if (!this.map || !this.leaflet || !this.previewMode) {
      return;
    }

    this.propertyRectangle?.remove();
    this.propertyRectangle = undefined;

    const [latitude, longitude] = this.center;
    const width = this.propertyWidthKm;
    const height = this.propertyHeightKm;

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180 ||
      width <= 0 ||
      height <= 0
    ) {
      return;
    }

    const corners = plotCorners({
      center: [latitude, longitude],
      widthKm: width,
      heightKm: height,
    });

    this.propertyRectangle = this.leaflet.polygon(corners, {
      color: '#c9a86a',
      weight: 2,
      fillColor: '#c9a86a',
      fillOpacity: 0.25,
      interactive: false,
    });

    this.propertyRectangle.addTo(this.map);
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
