import { Injectable } from '@angular/core';
import { Coordinates, TerrainInfo } from '../models/listing.models';

interface RegionArea {
  name: string;
  south: number;
  north: number;
  west: number;
  east: number;
}

@Injectable({ providedIn: 'root' })
export class MoonService {
  private readonly regions: RegionArea[] = [
    { name: 'South Pole', south: -90, north: -85, west: -180, east: 180 },
    { name: 'North Pole', south: 85, north: 90, west: -180, east: 180 },
    { name: 'Montes Apenninus', south: 15, north: 25, west: -10, east: 5 },
    { name: 'Copernicus Region', south: 3, north: 17, west: -30, east: -10 },
    { name: 'Tycho Region', south: -50, north: -35, west: -20, east: 0 },
    { name: 'Mare Tranquillitatis', south: 0, north: 17, west: 20, east: 42 },
    { name: 'Mare Serenitatis', south: 20, north: 36, west: 10, east: 28 },
    { name: 'Mare Crisium', south: 10, north: 24, west: 50, east: 70 },
    { name: 'Mare Fecunditatis', south: -20, north: 5, west: 42, east: 62 },
    { name: 'Mare Nubium', south: -30, north: -12, west: -30, east: -5 },
    { name: 'Mare Imbrium', south: 20, north: 45, west: -35, east: 0 },
    { name: 'Mare Frigoris', south: 50, north: 65, west: -45, east: 45 },
    { name: 'Oceanus Procellarum', south: -15, north: 40, west: -80, east: -40 },
  ];

  getTerrainInfo(center: Coordinates): TerrainInfo {
    const [lat, lng] = center;
    return {
      region: this.findRegion(lat, lng),
      earthFacing: lng > -90 && lng < 90,
      likelyWaterIce: Math.abs(lat) >= 85,
    };
  }

  private findRegion(lat: number, lng: number): string {
    const match = this.regions.find(
      (r) => lat >= r.south && lat <= r.north && lng >= r.west && lng <= r.east,
    );
    return match ? match.name : 'Lunar Highlands';
  }

  getRegionNames(): string[] {
    return [...this.regions.map((r) => r.name), 'Lunar Highlands', 'Far Side Highlands'];
  }
}
