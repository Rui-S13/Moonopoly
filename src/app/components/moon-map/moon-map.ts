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
import { ImageService } from '../../services/image';

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

  @Input() highlightedId: number | null = null;

  @Input() fitTo: Listing | null = null;

  private propertyRectangle?: Leaflet.Polygon;

  @Output() boundsChange = new EventEmitter<Bounds>();
  @Output() listingSelected = new EventEmitter<Listing>();
  @Output() mapClicked = new EventEmitter<void>();
  @Input() selectedId: number | null = null;
  @Output() listingOpened = new EventEmitter<Listing>();
  @Output() viewChange = new EventEmitter<{ center: [number, number]; zoom: number }>();

  private map?: Leaflet.Map;
  private leaflet: typeof Leaflet | null = null;
  private markerLayer: Leaflet.LayerGroup | null = null;
  private popup?: Leaflet.Popup;
  private shapes = new Map<
    number,
    { marker: Leaflet.Marker; outline: Leaflet.Polygon; listing: Listing }
  >();

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private moonService: MoonService,
    private images: ImageService,
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
    this.map.on('moveend', () => {
      this.emitBounds();
      this.emitView();
    });

    this.updateMarkers();
    this.fitToPlot();
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

  private outlineStyle(_listing: Listing, highlighted: boolean): Leaflet.PolylineOptions {
    return {
      color: highlighted ? '#d9480f' : '#12141a',
      weight: highlighted ? 3 : 1.5,
      fillColor: '#c9a86a',
      fillOpacity: highlighted ? 0.5 : 0.3,
    };
  }

  private fitToPlot(): void {
    if (!this.map || !this.leaflet || !this.fitTo) return;

    const bounds = this.leaflet.latLngBounds(plotCorners(this.fitTo));
    this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
  }

  ngOnChanges(changes: SimpleChanges): void {
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

    if (changes['highlightedId'] && this.markerLayer) {
      this.applyHighlight();
    }

    if (changes['selectedId'] && this.map) {
      this.syncPopup();
    }
  }

  private updateMarkers(): void {
    if (!this.leaflet || !this.markerLayer) return;
    this.markerLayer.clearLayers();
    this.shapes.clear();

    for (const listing of this.listings) {
      const highlighted = listing.id === this.highlightedId;

      const markerIcon = this.leaflet.divIcon({
        className: 'property-marker',
        html: `
    <div class="property-marker-icon status-${listing.status}">
      <svg viewBox="0 0 32 42" aria-hidden="true">
        <path
          d="M16 1C8.3 1 2 7.1 2 14.7 2 25 16 41 16 41s14-16 14-26.3C30 7.1 23.7 1 16 1z"
          fill="#c9a86a" stroke="#12141a" stroke-width="2" stroke-linejoin="round"
        />
        <circle cx="16" cy="15" r="5.5" fill="#12141a" />
      </svg>
    </div>
  `,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -38],
      });

      const marker = this.leaflet.marker(listing.center, { icon: markerIcon });

      marker.on('mouseover', () => marker.getElement()?.classList.add('selected-marker'));
      marker.on('mouseout', () => {
        if (listing.id !== this.highlightedId) {
          marker.getElement()?.classList.remove('selected-marker');
        }
      });

      this.syncPopup();

      marker.on('click', () => this.listingSelected.emit(listing));

      const outline = this.leaflet.polygon(plotCorners(listing), {
        ...this.outlineStyle(listing, highlighted),
        bubblingMouseEvents: false,
      });
      outline.on('click', () => this.listingSelected.emit(listing));

      outline.addTo(this.markerLayer);
      marker.addTo(this.markerLayer);

      this.shapes.set(listing.id, { marker, outline, listing });
      if (highlighted) {
        marker.getElement()?.classList.add('selected-marker');
        marker.setZIndexOffset(1000);
      }
    }
  }

  private applyHighlight(): void {
    for (const [id, shape] of this.shapes) {
      const on = id === this.highlightedId;
      shape.marker.getElement()?.classList.toggle('selected-marker', on);
      shape.marker.setZIndexOffset(on ? 1000 : 0);
      shape.outline.setStyle(this.outlineStyle(shape.listing, on));
      if (on) shape.outline.bringToFront();
    }
  }

  private syncPopup(): void {
    if (!this.map || !this.leaflet) return;

    this.popup?.remove();
    this.popup = undefined;

    const shape = this.selectedId !== null ? this.shapes.get(this.selectedId) : undefined;
    if (!shape) return;

    this.popup = this.leaflet
      .popup({
        offset: [0, -38],
        closeButton: false,
        maxWidth: 240,
        className: 'listing-popup-wrap',
        autoPanPadding: [40, 40],
      })
      .setLatLng(shape.listing.center)
      .setContent(this.popupContent(shape.listing))
      .openOn(this.map);
  }

  private popupContent(listing: Listing): HTMLElement {
    const price = `$${listing.price.toLocaleString('en-US')}`;
    const terrain = this.moonService.getTerrainInfo(listing.center);

    const card = document.createElement('div');
    card.className = 'listing-popup';
    card.addEventListener('click', () => this.listingOpened.emit(listing));

    const img = document.createElement('img');
    img.src = this.images.urlFor(listing.imageUrl);
    img.alt = '';
    img.onerror = () => {
      img.src = this.images.placeholder;
    };
    card.appendChild(img);

    const priceEl = document.createElement('p');
    priceEl.className = 'popup-price';
    priceEl.textContent = listing.type === 'rent' ? `${price} / month` : price;

    const meta = document.createElement('p');
    meta.className = 'popup-meta';
    meta.textContent = `${listing.widthKm * listing.heightKm} km² · ${terrain.region}`;

    const status = document.createElement('p');
    status.className = 'popup-status';
    status.textContent = `${listing.type === 'rent' ? 'For rent' : 'For sale'} · ${listing.status}`;

    const link = document.createElement('p');
    link.className = 'popup-link';
    link.textContent = 'View details →';

    card.append(priceEl, meta, status, link);
    return card;
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

    const plotBounds = this.propertyRectangle.getBounds();
    const view = this.map.getBounds();
    const tooSmall =
      plotBounds.getEast() - plotBounds.getWest() < (view.getEast() - view.getWest()) / 20;

    if (!view.contains(plotBounds) || tooSmall) {
      this.map.fitBounds(plotBounds, { padding: [40, 40], maxZoom: 8 });
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

  private emitView(): void {
    if (!this.map) return;
    const c = this.map.getCenter();
    this.viewChange.emit({ center: [c.lat, c.lng], zoom: this.map.getZoom() });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
